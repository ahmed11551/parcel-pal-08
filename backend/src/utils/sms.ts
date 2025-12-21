// SMS service with support for multiple providers
// В продакшене настроить реальный SMS провайдер

import { logger, metrics } from './logger.js';

// Таймаут для SMS запросов (10 секунд)
const SMS_TIMEOUT = 10000;

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`SMS request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const startTime = Date.now();
  const provider = process.env.SMS_PROVIDER || 'mock';
  const message = `Ваш код для SendBuddy: ${code}`;

  // В режиме разработки или если провайдер не настроен - используем mock
  if (process.env.NODE_ENV === 'development' || provider === 'mock') {
    logger.debug({ phone, code }, 'MOCK SMS sent');
    const duration = Date.now() - startTime;
    metrics.record('sms_send_duration', duration, { provider: 'mock', status: 'success' });
    return true;
  }

  // Twilio
  if (provider === 'twilio') {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        logger.warn('Twilio not configured, using mock mode');
        const duration = Date.now() - startTime;
        metrics.record('sms_send_duration', duration, { provider: 'twilio', status: 'mock' });
        return true;
      }

      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      await Promise.race([
        client.messages.create({
          body: message,
          from: fromNumber,
          to: phone,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Twilio timeout')), SMS_TIMEOUT)
        ),
      ]);
      
      const duration = Date.now() - startTime;
      logger.info({ phone, provider: 'twilio', duration }, 'SMS sent');
      metrics.record('sms_send_duration', duration, { provider: 'twilio', status: 'success' });
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({ err: error, phone, provider: 'twilio', duration }, 'SMS send failed');
      metrics.record('sms_send_duration', duration, { provider: 'twilio', status: 'error' });
      return true;
    }
  }

  // SMS.ru
  if (provider === 'smsru') {
    try {
      const apiId = process.env.SMSRU_API_ID;
      if (!apiId) {
        logger.warn('SMS.ru not configured, using mock mode');
        const duration = Date.now() - startTime;
        metrics.record('sms_send_duration', duration, { provider: 'smsru', status: 'mock' });
        return true;
      }

      // Форматируем номер телефона для SMS.ru (убираем +, оставляем только цифры)
      const normalizedPhone = phone.replace(/\D/g, '');
      // Если номер начинается с 8, заменяем на 7
      const formattedPhone = normalizedPhone.startsWith('8') 
        ? '7' + normalizedPhone.slice(1) 
        : normalizedPhone.startsWith('7') 
          ? normalizedPhone 
          : '7' + normalizedPhone;

      const response = await fetchWithTimeout(
        'https://sms.ru/sms/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            api_id: apiId,
            to: formattedPhone,
            msg: message,
            json: '1',
          }),
        },
        SMS_TIMEOUT
      );

      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      // SMS.ru возвращает status_code: 100 для успешной отправки
      if (data.status === 'OK' && data.status_code === 100) {
        logger.info({ 
          phone, 
          provider: 'smsru', 
          duration,
          balance: data.balance,
        }, 'SMS sent');
        metrics.record('sms_send_duration', duration, { provider: 'smsru', status: 'success' });
        return true;
      } else {
        // Обработка различных кодов ошибок SMS.ru
        const errorMessages: Record<number, string> = {
          200: 'Неправильный api_id',
          201: 'Не хватает средств на счете',
          202: 'Неправильно указан получатель',
          203: 'Нет текста сообщения',
          204: 'Имя отправителя не согласовано с администрацией',
          205: 'Сообщение слишком длинное',
          206: 'Будет превышен или уже превышен дневной лимит на отправку',
          207: 'На этот номер нельзя отправлять сообщения',
          208: 'Параметр time указан неправильно',
          209: 'Вы добавили этот номер в стоп-лист',
          210: 'Используется GET, где необходимо использовать POST',
          211: 'Метод не найден',
          212: 'Текст сообщения необходимо передать в кодировке UTF-8',
          213: 'Указано более 100 номеров в списке получателей',
          214: 'Номер находится в федеральном стоп-листе SMS.RU',
          215: 'Номер находится в стоп-листе вашего аккаунта',
          216: 'Номер находится в стоп-листе получателя',
          217: 'Параметр ttl указан неправильно',
          220: 'Сервис временно недоступен, попробуйте чуть позже',
          230: 'Превышен общий лимит на количество сообщений на этот номер в день',
          231: 'Превышен лимит на одинаковые сообщения на этот номер в минуту',
          232: 'Превышен лимит на одинаковые сообщения на этот номер в день',
          300: 'Неправильный token',
          301: 'Token временно заблокирован',
          302: 'Token не найден',
        };

        const errorMsg = errorMessages[data.status_code] || `Unknown error (code: ${data.status_code})`;
        const duration = Date.now() - startTime;
        logger.error({ 
          err: { code: data.status_code, message: errorMsg, data },
          phone,
          provider: 'smsru',
          duration,
        }, 'SMS send failed');
        metrics.record('sms_send_duration', duration, { provider: 'smsru', status: 'error', code: data.status_code });
        
        // Для критических ошибок (нет средств, неправильный API ID) можно вернуть false
        if (data.status_code === 200 || data.status_code === 201) {
          return false;
        }
        
        return true; // Для остальных ошибок не блокируем процесс
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({ err: error, phone, provider: 'smsru', duration }, 'SMS send error');
      metrics.record('sms_send_duration', duration, { provider: 'smsru', status: 'error', type: error.name });
      return true;
    }
  }

  // SMSC.ru
  if (provider === 'smscru') {
    try {
      const login = process.env.SMSCRU_LOGIN;
      const password = process.env.SMSCRU_PASSWORD;
      
      if (!login || !password) {
        console.warn('⚠️ SMSC.ru не настроен. Используется mock режим.');
        console.log(`📱 [MOCK SMS] To ${phone}: ${message}`);
        return true;
      }

      // Форматируем номер
      const normalizedPhone = phone.replace(/\D/g, '');
      const formattedPhone = normalizedPhone.startsWith('8') 
        ? '7' + normalizedPhone.slice(1) 
        : normalizedPhone.startsWith('7') 
          ? normalizedPhone 
          : '7' + normalizedPhone;

      const response = await fetch('https://smsc.ru/sys/send.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          login: login,
          psw: password,
          phones: formattedPhone,
          mes: message,
          fmt: '3', // JSON формат
          charset: 'utf-8',
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error(`❌ Ошибка SMSC.ru: ${data.error}`);
        return true; // Не блокируем процесс
      }
      
      console.log(`✅ SMS отправлен на ${phone} через SMSC.ru`);
      if (data.balance) {
        console.log(`💰 Баланс SMSC.ru: ${data.balance} руб.`);
      }
      return true;
    } catch (error: any) {
      console.error('Ошибка отправки SMS через SMSC.ru:', error);
      return true;
    }
  }

  // GetSMS.online
  if (provider === 'getsms') {
    try {
      const apiKey = process.env.GETSMS_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️ GetSMS.online не настроен. Используется mock режим.');
        console.log(`📱 [MOCK SMS] To ${phone}: ${message}`);
        return true;
      }

      const normalizedPhone = phone.replace(/\D/g, '');
      const formattedPhone = normalizedPhone.startsWith('8') 
        ? '7' + normalizedPhone.slice(1) 
        : normalizedPhone.startsWith('7') 
          ? normalizedPhone 
          : '7' + normalizedPhone;

      const response = await fetch('https://api.getsms.online/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ SMS отправлен на ${phone} через GetSMS.online`);
        return true;
      } else {
        console.error(`❌ Ошибка GetSMS.online: ${data.error || 'Unknown error'}`);
        return true;
      }
    } catch (error: any) {
      console.error('Ошибка отправки SMS через GetSMS.online:', error);
      return true;
    }
  }

  // По умолчанию mock
  const duration = Date.now() - startTime;
  logger.debug({ phone, code, duration }, 'MOCK SMS (default)');
  metrics.record('sms_send_duration', duration, { provider: 'mock', status: 'success' });
  return true;
}

export function generateSMSCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

