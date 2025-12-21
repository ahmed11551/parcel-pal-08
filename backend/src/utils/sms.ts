// SMS service with support for multiple providers
// В продакшене настроить реальный SMS провайдер

export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const provider = process.env.SMS_PROVIDER || 'mock';
  const message = `Ваш код для SendBuddy: ${code}`;

  // В режиме разработки или если провайдер не настроен - используем mock
  if (process.env.NODE_ENV === 'development' || provider === 'mock') {
    console.log(`📱 [MOCK SMS] To ${phone}: ${message}`);
    console.log(`💡 В development режиме SMS не отправляется. Код: ${code}`);
    return true;
  }

  // Twilio
  if (provider === 'twilio') {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.warn('⚠️ Twilio не настроен. Используется mock режим.');
        console.log(`📱 [MOCK SMS] To ${phone}: ${message}`);
        return true;
      }

      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: phone,
      });
      
      console.log(`✅ SMS отправлен на ${phone}`);
      return true;
    } catch (error: any) {
      console.error('Ошибка отправки SMS через Twilio:', error);
      // В случае ошибки возвращаем true, чтобы не блокировать процесс
      // В production можно изменить на false
      return true;
    }
  }

  // SMS.ru
  if (provider === 'smsru') {
    try {
      const apiId = process.env.SMSRU_API_ID;
      if (!apiId) {
        console.warn('⚠️ SMS.ru не настроен. Используется mock режим.');
        console.log(`📱 [MOCK SMS] To ${phone}: ${message}`);
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

      const response = await fetch('https://sms.ru/sms/send', {
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
      });

      const data = await response.json();
      
      // SMS.ru возвращает status_code: 100 для успешной отправки
      if (data.status === 'OK' && data.status_code === 100) {
        console.log(`✅ SMS отправлен на ${phone} через SMS.ru`);
        if (data.balance !== undefined) {
          console.log(`💰 Баланс SMS.ru: ${data.balance} руб.`);
        }
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

        const errorMsg = errorMessages[data.status_code] || `Неизвестная ошибка (код: ${data.status_code})`;
        console.error(`❌ Ошибка SMS.ru (код ${data.status_code}): ${errorMsg}`);
        console.error('Детали:', data);
        
        // Для критических ошибок (нет средств, неправильный API ID) можно вернуть false
        if (data.status_code === 200 || data.status_code === 201) {
          return false;
        }
        
        return true; // Для остальных ошибок не блокируем процесс
      }
    } catch (error: any) {
      console.error('Ошибка отправки SMS через SMS.ru:', error);
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
  console.log(`📱 [MOCK SMS] To ${phone}: ${message}`);
  return true;
}

export function generateSMSCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

