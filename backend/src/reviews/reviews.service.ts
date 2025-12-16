import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const order = await this.orderRepository.findOne({
      where: { id: createReviewDto.orderId },
      relations: ['sender', 'carrier'],
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Можно оставить отзыв только после доставки');
    }

    // Определяем, кто оставляет отзыв и кому
    const isSender = order.senderId === userId;
    const isCarrier = order.carrierId === userId;

    if (!isSender && !isCarrier) {
      throw new ForbiddenException('Вы не являетесь участником этого заказа');
    }

    const reviewedUserId = isSender ? order.carrierId : order.senderId;

    // Проверяем, не оставлял ли уже отзыв
    const existingReview = await this.reviewRepository.findOne({
      where: {
        orderId: createReviewDto.orderId,
        reviewerId: userId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Вы уже оставили отзыв по этому заказу');
    }

    const review = this.reviewRepository.create({
      orderId: createReviewDto.orderId,
      reviewerId: userId,
      reviewedId: reviewedUserId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Обновляем рейтинг пользователя
    await this.updateUserRating(reviewedUserId);

    // Если оба оставили отзывы, помечаем заказ как завершенный
    const reviewsCount = await this.reviewRepository.count({
      where: { orderId: createReviewDto.orderId },
    });

    if (reviewsCount >= 2) {
      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    }

    return savedReview;
  }

  async findAll(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { reviewedId: userId },
      relations: ['reviewer', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'reviewed', 'order'],
    });

    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    return review;
  }

  private async updateUserRating(userId: string): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: { reviewedId: userId },
    });

    if (reviews.length === 0) {
      return;
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.userRepository.update(userId, {
      rating: Math.round(averageRating * 10) / 10, // округляем до 1 знака
    });
  }
}

