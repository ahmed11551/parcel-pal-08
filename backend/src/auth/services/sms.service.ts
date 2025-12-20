import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  constructor(private configService: ConfigService) {}

  async sendSms(phone: string, message: string): Promise<void> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'twilio');

    if (provider === 'twilio') {
      await this.sendViaTwilio(phone, message);
    } else {
      // Можно добавить другие провайдеры
      console.log(`[SMS] Sending to ${phone}: ${message}`);
    }
  }

  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('⚠️ Twilio не настроен. SMS не будет отправлен.');
      console.log(`[SMS Mock] Код для ${phone}: ${message}`);
      // В development режиме можно использовать mock
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        return;
      }
      throw new Error('Twilio не настроен. Проверьте TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    }

    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: phone,
      });
      
      console.log(`✅ SMS отправлен на ${phone}`);
    } catch (error: any) {
      console.error('Ошибка отправки SMS через Twilio:', error);
      throw new Error(`Ошибка отправки SMS: ${error.message}`);
    }
  }
}

