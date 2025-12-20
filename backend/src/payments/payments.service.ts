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
  private cloudPaymentsPublicId: string | null = null;
  private cloudPaymentsApiSecret: string | null = null;

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
      console.warn('⚠️ YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY не настроены.');
    }

    // Инициализация CloudPayments (лучший вариант для самозанятых)
    this.cloudPaymentsPublicId = this.configService.get<string>('CLOUDPAYMENTS_PUBLIC_ID');
    this.cloudPaymentsApiSecret = this.configService.get<string>('CLOUDPAYMENTS_API_SECRET');
    
    if (this.cloudPaymentsPublicId && this.cloudPaymentsApiSecret) {
      console.log('✅ CloudPayments инициализирован (рекомендуется для самозанятых)');
    } else {
      console.warn('⚠️ CLOUDPAYMENTS_PUBLIC_ID или CLOUDPAYMENTS_API_SECRET не настроены.');
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
    } else if (createPaymentDto.provider === PaymentProvider.CLOUDPAYMENTS) {
      const payment = await this.createCloudPaymentsPayment(order);
      paymentId = payment.TransactionId.toString();
      confirmationUrl = payment.Model; // URL для оплаты
    } else {
      throw new BadRequestException('Провайдер не поддерживается. Используйте yookassa или cloudpayments');
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

  private async createCloudPaymentsPayment(order: Order) {
    if (!this.cloudPaymentsPublicId || !this.cloudPaymentsApiSecret) {
      throw new BadRequestException('CloudPayments не настроен. Проверьте CLOUDPAYMENTS_PUBLIC_ID и CLOUDPAYMENTS_API_SECRET в .env');
    }

    try {
      // CloudPayments API для создания платежа
      const axios = require('axios');
      const baseUrl = 'https://api.cloudpayments.ru';
      
      // Создаем платеж через CloudPayments API
      const response = await axios.post(
        `${baseUrl}/payments/cards/charge`,
        {
          Amount: order.totalAmount, // сумма в копейках
          Currency: 'RUB',
          InvoiceId: order.id,
          Description: `Оплата заказа #${order.id}`,
          AccountId: order.senderId,
          Email: null,
          RequireConfirmation: true, // двухстадийный платеж (холдирование)
          SendEmail: false,
          Data: {
            orderId: order.id,
          },
        },
        {
          auth: {
            username: this.cloudPaymentsPublicId,
            password: this.cloudPaymentsApiSecret,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Для двухстадийного платежа используем метод auth
      const authResponse = await axios.post(
        `${baseUrl}/payments/cards/auth`,
        {
          Amount: order.totalAmount,
          Currency: 'RUB',
          InvoiceId: order.id,
          Description: `Оплата заказа #${order.id} (эскроу)`,
          AccountId: order.senderId,
          Email: null,
          Data: {
            orderId: order.id,
          },
        },
        {
          auth: {
            username: this.cloudPaymentsPublicId,
            password: this.cloudPaymentsApiSecret,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Возвращаем данные для создания виджета оплаты
      return {
        TransactionId: authResponse.data.Model?.TransactionId || authResponse.data.Model?.Id,
        Model: authResponse.data.Model,
        Success: authResponse.data.Success,
        Message: authResponse.data.Message,
      };
    } catch (error: any) {
      console.error('Ошибка создания платежа CloudPayments:', error.response?.data || error.message);
      throw new BadRequestException(`Ошибка создания платежа CloudPayments: ${error.response?.data?.Message || error.message}`);
    }
  }

  async handleWebhook(paymentId: string, event: string, data: any, provider?: PaymentProvider): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['order'],
    });

    if (!payment) {
      return;
    }

    // Определяем провайдера из данных или параметра
    const paymentProvider = provider || payment.provider;

    if (paymentProvider === PaymentProvider.YOOKASSA) {
      // Обработка webhook от ЮKassa
      switch (event) {
        case 'payment.succeeded':
          if (data.status === 'succeeded') {
            payment.status = PaymentStatus.HELD;
            await this.paymentRepository.save(payment);
            
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
    } else if (paymentProvider === PaymentProvider.CLOUDPAYMENTS) {
      // Обработка webhook от CloudPayments
      // CloudPayments отправляет разные события
      if (data.Status === 'Authorized' || data.Status === 'Completed') {
        payment.status = PaymentStatus.HELD;
        await this.paymentRepository.save(payment);
        
        const order = await this.orderRepository.findOne({
          where: { id: payment.orderId },
        });
        if (order) {
          order.status = OrderStatus.PAID;
          await this.orderRepository.save(order);
        }
      } else if (data.Status === 'Cancelled' || data.Status === 'Declined') {
        payment.status = PaymentStatus.CANCELLED;
        await this.paymentRepository.save(payment);
      }
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
    } else if (payment.provider === PaymentProvider.CLOUDPAYMENTS) {
      if (!this.cloudPaymentsPublicId || !this.cloudPaymentsApiSecret) {
        throw new BadRequestException('CloudPayments не настроен');
      }

      // Подтверждение платежа в CloudPayments
      const axios = require('axios');
      await axios.post(
        `https://api.cloudpayments.ru/payments/confirm`,
        {
          TransactionId: payment.paymentId,
          Amount: payment.amount,
        },
        {
          auth: {
            username: this.cloudPaymentsPublicId,
            password: this.cloudPaymentsApiSecret,
          },
        }
      );

      payment.status = PaymentStatus.CAPTURED;
      await this.paymentRepository.save(payment);
    }

    // Переводим деньги курьеру (минус комиссия)
    const order = await this.orderRepository.findOne({
      where: { id: payment.orderId },
    });
    if (order) {
      // Здесь должна быть логика перевода денег курьеру
      // В реальном проекте это интеграция с платежной системой для выплат
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
    } else if (payment.provider === PaymentProvider.CLOUDPAYMENTS) {
      if (!this.cloudPaymentsPublicId || !this.cloudPaymentsApiSecret) {
        throw new BadRequestException('CloudPayments не настроен');
      }

      // Возврат платежа в CloudPayments
      const axios = require('axios');
      await axios.post(
        `https://api.cloudpayments.ru/payments/refund`,
        {
          TransactionId: payment.paymentId,
          Amount: amount || payment.amount,
        },
        {
          auth: {
            username: this.cloudPaymentsPublicId,
            password: this.cloudPaymentsApiSecret,
          },
        }
      );

      payment.status = PaymentStatus.REFUNDED;
      await this.paymentRepository.save(payment);
    }

    return payment;
  }
}

