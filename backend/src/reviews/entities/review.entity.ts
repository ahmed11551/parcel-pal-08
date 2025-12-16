import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('reviews')
@Index(['reviewedId'])
@Index(['orderId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  orderId: string;

  @ManyToOne(() => User, (user) => user.givenReviews)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => User, (user) => user.receivedReviews)
  @JoinColumn({ name: 'reviewedId' })
  reviewed: User;

  @Column()
  reviewedId: string;

  @Column({ type: 'int' })
  rating: number; // от 1 до 5

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}

