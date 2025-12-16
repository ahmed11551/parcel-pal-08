import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  HELD = 'held', // деньги заморожены (эскроу)
  CAPTURED = 'captured', // деньги списаны
  REFUNDED = 'refunded', // возврат
  CANCELLED = 'cancelled',
}

export enum PaymentProvider {
  YOOKASSA = 'yookassa',
  CLOUDPAYMENTS = 'cloudpayments',
}

@Entity('payments')
@Index(['orderId'])
@Index(['paymentId']) // ID платежа в платежной системе
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @Column({ unique: true })
  paymentId: string; // ID платежа в платежной системе

  @Column({ type: 'int' })
  amount: number; // сумма в копейках

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  confirmationUrl: string; // URL для подтверждения платежа

  @Column('json', { nullable: true })
  metadata: Record<string, any>; // дополнительные данные от платежной системы

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

