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
    // В production здесь будет реальная интеграция с Twilio
    // const twilio = require('twilio');
    // const client = twilio(
    //   this.configService.get('TWILIO_ACCOUNT_SID'),
    //   this.configService.get('TWILIO_AUTH_TOKEN'),
    // );
    // await client.messages.create({
    //   body: message,
    //   from: this.configService.get('TWILIO_PHONE_NUMBER'),
    //   to: phone,
    // });
    
    console.log(`[Twilio] Sending to ${phone}: ${message}`);
  }
}

