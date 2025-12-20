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

      const response = await fetch('https://sms.ru/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          to: phone,
          msg: message,
          json: '1',
        }),
      });

      const data = await response.json();
      if (data.status === 'OK') {
        console.log(`✅ SMS отправлен на ${phone} через SMS.ru`);
        return true;
      } else {
        console.error('Ошибка SMS.ru:', data);
        return true; // Не блокируем процесс
      }
    } catch (error: any) {
      console.error('Ошибка отправки SMS через SMS.ru:', error);
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

