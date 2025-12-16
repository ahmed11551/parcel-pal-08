import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Review } from '../../reviews/entities/review.entity';

export enum OrderStatus {
  PENDING = 'pending', // ожидает выбора курьера
  CARRIER_SELECTED = 'carrier_selected', // курьер выбран, ожидается оплата
  PAID = 'paid', // оплачено, ожидается передача посылки
  PACKAGE_RECEIVED = 'package_received', // курьер получил посылку
  IN_TRANSIT = 'in_transit', // курьер в пути
  DELIVERED = 'delivered', // доставлено
  COMPLETED = 'completed', // завершено (после отзывов)
  CANCELLED = 'cancelled', // отменено
  DISPUTE = 'dispute', // спорная ситуация
}

@Entity('orders')
@Index(['senderId', 'status'])
@Index(['carrierId', 'status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, (task) => task.orders)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User, (user) => user.sentOrders)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => User, (user) => user.carrierOrders)
  @JoinColumn({ name: 'carrierId' })
  carrier: User;

  @Column({ nullable: true })
  carrierId: string;

  @Column('text', { nullable: true })
  carrierMessage: string; // сообщение курьера при отклике

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'int' })
  reward: number; // вознаграждение курьеру

  @Column({ type: 'int' })
  platformFee: number; // комиссия платформы (15%)

  @Column({ type: 'int' })
  totalAmount: number; // общая сумма к оплате (reward + platformFee)

  @OneToMany(() => ChatMessage, (message) => message.order)
  messages: ChatMessage[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToMany(() => Review, (review) => review.order)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

