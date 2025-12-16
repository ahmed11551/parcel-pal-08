import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentProvider } from './entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { YooKassa } from '@a2seven/yoo-kassa';

@Injectable()
export class PaymentsService {
  private yooKassaClient: YooKassa | null = null;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
  ) {
    // Инициализация ЮKassa
    const shopId = this.configService.get<string>('YOOKASSA_SHOP_ID');
    const secretKey = this.configService.get<string>('YOOKASSA_SECRET_KEY');
    
    if (shopId && secretKey) {
      try {
        this.yooKassaClient = new YooKassa({
          shopId,
          secretKey,
        });
        console.log('✅ ЮKassa инициализирована');
      } catch (error) {
        console.warn('⚠️ Ошибка инициализации ЮKassa:', error);
      }
    } else {
      console.warn('⚠️ YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY не настроены. Платежи будут недоступны.');
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['task'],
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    if (order.status !== OrderStatus.CARRIER_SELECTED) {
      throw new BadRequestException('Заказ не готов к оплате');
    }

    // Проверяем, нет ли уже активного платежа
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        orderId: createPaymentDto.orderId,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment) {
      return existingPayment;
    }

    let paymentId: string;
    let confirmationUrl: string;

    if (createPaymentDto.provider === PaymentProvider.YOOKASSA) {
      const payment = await this.createYooKassaPayment(order);
      paymentId = payment.id;
      confirmationUrl = payment.confirmation?.confirmation_url;
    } else {
      throw new BadRequestException('Провайдер не поддерживается');
    }

    const payment = this.paymentRepository.create({
      orderId: createPaymentDto.orderId,
      provider: createPaymentDto.provider,
      paymentId,
      amount: order.totalAmount * 100, // в копейках
      status: PaymentStatus.PENDING,
      confirmationUrl,
    });

    return this.paymentRepository.save(payment);
  }

  private async createYooKassaPayment(order: Order) {
    if (!this.yooKassaClient) {
      throw new BadRequestException('ЮKassa не настроена. Проверьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env');
    }

    try {
      const payment = await this.yooKassaClient.createPayment({
        amount: {
          value: (order.totalAmount / 100).toFixed(2),
          currency: 'RUB',
        },
        capture: false, // двухстадийный платеж (холдирование)
        confirmation: {
          type: 'redirect',
          return_url: this.configService.get<string>('PAYMENT_RETURN_URL') || 
                     `${this.configService.get<string>('FRONTEND_URL')}/payment/success`,
        },
        description: `Оплата заказа #${order.id}`,
        metadata: {
          orderId: order.id,
        },
      }, 'payment');

      return payment;
    } catch (error: any) {
      console.error('Ошибка создания платежа ЮKassa:', error);
      throw new BadRequestException(`Ошибка создания платежа: ${error.message}`);
    }
  }

  async handleWebhook(paymentId: string, event: string, data: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['order'],
    });

    if (!payment) {
      return;
    }

    switch (event) {
      case 'payment.succeeded':
        if (data.status === 'succeeded') {
          payment.status = PaymentStatus.HELD;
          await this.paymentRepository.save(payment);
          
          // Обновляем статус заказа
          const order = await this.orderRepository.findOne({
            where: { id: payment.orderId },
          });
          if (order) {
            order.status = OrderStatus.PAID;
            await this.orderRepository.save(order);
          }
        }
        break;
      case 'payment.canceled':
        payment.status = PaymentStatus.CANCELLED;
        await this.paymentRepository.save(payment);
        break;
    }
  }

  async capturePayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    if (payment.status !== PaymentStatus.HELD) {
      throw new BadRequestException('Платеж не может быть подтвержден');
    }

    if (payment.provider === PaymentProvider.YOOKASSA) {
      if (!this.yooKassaClient) {
        throw new BadRequestException('ЮKassa не настроена');
      }

      await this.yooKassaClient.capturePayment(payment.paymentId, {
        amount: {
          value: (payment.amount / 100).toFixed(2),
          currency: 'RUB',
        },
      });

      payment.status = PaymentStatus.CAPTURED;
      await this.paymentRepository.save(payment);

      // Переводим деньги курьеру (минус комиссия)
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });
      if (order) {
        // Здесь должна быть логика перевода денег курьеру
        // В реальном проекте это интеграция с платежной системой для выплат
      }
    }

    return payment;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    if (payment.provider === PaymentProvider.YOOKASSA) {
      if (!this.yooKassaClient) {
        throw new BadRequestException('ЮKassa не настроена');
      }

      await this.yooKassaClient.createRefund(payment.paymentId, {
        amount: {
          value: amount ? (amount / 100).toFixed(2) : (payment.amount / 100).toFixed(2),
          currency: 'RUB',
        },
      });

      payment.status = PaymentStatus.REFUNDED;
      await this.paymentRepository.save(payment);
    }

    return payment;
  }
}

