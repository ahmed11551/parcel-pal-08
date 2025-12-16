import { Controller, Post, Put, Body, Param, UseGuards, Request, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать платеж (эскроу)' })
  async create(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Webhook от платежной системы' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-request-id') requestId: string,
  ) {
    // Обработка webhook от ЮKassa
    if (provider === 'yookassa') {
      await this.paymentsService.handleWebhook(
        body.object.id,
        body.event,
        body.object,
      );
    }
    return { ok: true };
  }

  @Put(':paymentId/capture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подтвердить платеж (перевести деньги курьеру)' })
  async capturePayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.capturePayment(paymentId);
  }

  @Put(':paymentId/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Вернуть платеж' })
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount?: number },
  ) {
    return this.paymentsService.refundPayment(paymentId, body.amount);
  }
}

