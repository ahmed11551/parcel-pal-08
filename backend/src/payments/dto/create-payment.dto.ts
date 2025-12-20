import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID заказа' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Платежный провайдер', enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;
}

