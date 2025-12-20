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
import { Order } from '../../orders/entities/order.entity';

export enum TaskStatus {
  PENDING_MODERATION = 'pending_moderation',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum TaskSize {
  S = 'S',
  M = 'M',
  L = 'L',
}

@Entity('tasks')
@Index(['fromAirport', 'toAirport', 'status'])
@Index(['status', 'dateFrom', 'dateTo'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('simple-array')
  photos: string[]; // URLs к фото

  @Column({
    type: 'enum',
    enum: TaskSize,
  })
  size: TaskSize;

  @Column({ type: 'int', nullable: true })
  estimatedValue: number; // в рублях, максимум 10000

  @Column()
  fromAirport: string; // код аэропорта (SVO, DME, etc.)

  @Column({ nullable: true })
  fromPoint: string; // место встречи в аэропорту

  @Column()
  toAirport: string;

  @Column({ nullable: true })
  toPoint: string;

  @Column('date')
  dateFrom: Date;

  @Column('date')
  dateTo: Date;

  @Column({ type: 'int' })
  reward: number; // вознаграждение курьеру в рублях

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING_MODERATION,
  })
  status: TaskStatus;

  @Column({ nullable: true })
  moderationComment: string; // комментарий модератора при отклонении

  @Column({ nullable: true })
  moderatedBy: string; // ID админа, который модерировал

  @Column({ nullable: true })
  moderatedAt: Date;

  @OneToMany(() => Order, (order) => order.task)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

