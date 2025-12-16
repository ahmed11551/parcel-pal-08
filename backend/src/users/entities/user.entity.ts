import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum VerificationMethod {
  PHONE = 'phone',
  TELEGRAM = 'telegram',
  VK = 'vk',
  ADVANCED = 'advanced', // селфи с документом
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  completedDeliveries: number; // как курьер

  @Column({ default: 0 })
  sentDeliveries: number; // как отправитель

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: VerificationMethod,
    nullable: true,
  })
  verificationMethod: VerificationMethod;

  @Column({ nullable: true })
  socialId: string; // ID в соцсети (Telegram/VK)

  @Column({ nullable: true })
  socialProvider: string; // telegram, vk

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ nullable: true })
  verificationCodeExpiresAt: Date;

  @OneToMany(() => Task, (task) => task.sender)
  tasks: Task[];

  @OneToMany(() => Order, (order) => order.sender)
  sentOrders: Order[];

  @OneToMany(() => Order, (order) => order.carrier)
  carrierOrders: Order[];

  @OneToMany(() => Review, (review) => review.reviewer)
  givenReviews: Review[];

  @OneToMany(() => Review, (review) => review.reviewed)
  receivedReviews: Review[];

  @OneToMany(() => ChatMessage, (message) => message.sender)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

