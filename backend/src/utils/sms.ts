// Mock SMS service for development
// В продакшене заменить на реальный SMS провайдер (Twilio, SMS.ru и т.д.)

export async function sendSMS(phone: string, code: string): Promise<boolean> {
  // В режиме разработки просто логируем
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 SMS to ${phone}: Your code is ${code}`);
    return true;
  }

  // В продакшене здесь будет реальный вызов SMS API
  // const response = await fetch(process.env.SMS_API_URL, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ phone, message: `Your SendBuddy code: ${code}` })
  // });
  // return response.ok;

  return true;
}

export function generateSMSCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

