import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(userId: string, createMessageDto: CreateMessageDto): Promise<ChatMessage> {
    const order = await this.orderRepository.findOne({
      where: { id: createMessageDto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    // Проверяем, что пользователь является участником заказа
    if (order.senderId !== userId && order.carrierId !== userId) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }

    // Проверяем, что заказ не завершен (запрет на обмен контактами до завершения)
    // Разрешаем общение даже после завершения для разрешения споров

    // Проверка на запрещенные слова (контакты)
    const contactPattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|@\w+|t\.me\/\w+|vk\.com\/\w+/gi;
    if (contactPattern.test(createMessageDto.message)) {
      throw new ForbiddenException('Запрещено обмениваться контактами до завершения поездки');
    }

    const message = this.messageRepository.create({
      orderId: createMessageDto.orderId,
      senderId: userId,
      message: createMessageDto.message,
    });

    return this.messageRepository.save(message);
  }

  async findAll(orderId: string, userId: string): Promise<ChatMessage[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    if (order.senderId !== userId && order.carrierId !== userId) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }

    return this.messageRepository.find({
      where: { orderId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async markAsRead(orderId: string, userId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    // Помечаем все сообщения от другого пользователя как прочитанные
    const otherUserId = order.senderId === userId ? order.carrierId : order.senderId;
    
    await this.messageRepository.update(
      {
        orderId,
        senderId: otherUserId,
        isRead: false,
      },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const orders = await this.orderRepository.find({
      where: [
        { senderId: userId },
        { carrierId: userId },
      ],
    });

    const orderIds = orders.map(o => o.id);

    if (orderIds.length === 0) {
      return 0;
    }

    if (orderIds.length === 0) {
      return 0;
    }

    return this.messageRepository
      .createQueryBuilder('message')
      .where('message.orderId IN (:...orderIds)', { orderIds })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .getCount();
  }
}

