import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const task = await this.taskRepository.findOne({
      where: { id: createOrderDto.taskId },
      relations: ['sender'],
    });

    if (!task) {
      throw new NotFoundException('Задание не найдено');
    }

    if (task.senderId === userId) {
      throw new ForbiddenException('Нельзя откликнуться на свое задание');
    }

    if (task.status !== TaskStatus.ACTIVE) {
      throw new BadRequestException('Задание не активно');
    }

    // Проверяем, не откликался ли уже этот курьер
    const existingOrder = await this.orderRepository.findOne({
      where: {
        taskId: createOrderDto.taskId,
        carrierId: userId,
      },
    });

    if (existingOrder) {
      throw new BadRequestException('Вы уже откликнулись на это задание');
    }

    // Вычисляем комиссию (15%)
    const platformFee = Math.round(task.reward * 0.15);
    const totalAmount = task.reward + platformFee;

    const order = this.orderRepository.create({
      taskId: createOrderDto.taskId,
      senderId: task.senderId,
      carrierId: userId,
      carrierMessage: createOrderDto.carrierMessage,
      reward: task.reward,
      platformFee,
      totalAmount,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  async findAll(userId: string, role: 'sender' | 'carrier'): Promise<Order[]> {
    const where = role === 'sender' 
      ? { senderId: userId }
      : { carrierId: userId };

    return this.orderRepository.find({
      where,
      relations: ['task', 'sender', 'carrier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['task', 'sender', 'carrier', 'task.sender'],
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    if (order.senderId !== userId && order.carrierId !== userId) {
      throw new ForbiddenException('Нет доступа к этому заказу');
    }

    return order;
  }

  async selectCarrier(taskId: string, orderId: string, senderId: string): Promise<Order> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Задание не найдено');
    }

    if (task.senderId !== senderId) {
      throw new ForbiddenException('Только отправитель может выбрать курьера');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, taskId },
    });

    if (!order) {
      throw new NotFoundException('Отклик не найден');
    }

    // Отменяем все остальные отклики
    await this.orderRepository
      .createQueryBuilder()
      .update(Order)
      .set({ status: OrderStatus.CANCELLED })
      .where('taskId = :taskId AND id != :orderId', { taskId, orderId })
      .execute();

    // Обновляем статус выбранного заказа
    order.status = OrderStatus.CARRIER_SELECTED;
    task.status = TaskStatus.IN_PROGRESS;

    await this.taskRepository.save(task);
    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, userId: string, updateDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Проверяем права на изменение статуса
    const canUpdate = 
      (updateDto.status === OrderStatus.PACKAGE_RECEIVED && order.carrierId === userId) ||
      (updateDto.status === OrderStatus.DELIVERED && order.carrierId === userId) ||
      (order.senderId === userId || order.carrierId === userId);

    if (!canUpdate) {
      throw new ForbiddenException('Нет прав на изменение статуса');
    }

    // Валидация переходов статусов
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CARRIER_SELECTED, OrderStatus.CANCELLED],
      [OrderStatus.CARRIER_SELECTED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PACKAGE_RECEIVED, OrderStatus.CANCELLED],
      [OrderStatus.PACKAGE_RECEIVED]: [OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.DISPUTE]: [],
    };

    if (!validTransitions[order.status]?.includes(updateDto.status)) {
      throw new BadRequestException(`Невозможно перейти из статуса ${order.status} в ${updateDto.status}`);
    }

    order.status = updateDto.status;
    return this.orderRepository.save(order);
  }

  async markPackageReceived(orderId: string, carrierId: string): Promise<Order> {
    return this.updateStatus(orderId, carrierId, { status: OrderStatus.PACKAGE_RECEIVED });
  }

  async markDelivered(orderId: string, carrierId: string): Promise<Order> {
    return this.updateStatus(orderId, carrierId, { status: OrderStatus.DELIVERED });
  }
}

