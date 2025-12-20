import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { ModerateTaskDto } from './dto/moderate-task.dto';
import { BlockUserDto } from './dto/block-user.dto';

@Injectable()
export class AdminService {
  // Запрещенные ключевые слова для модерации
  private readonly forbiddenKeywords = [
    'наркотик', 'оружие', 'оружие', 'пистолет', 'автомат',
    'деньги', 'наличные', 'ювелир', 'золото', 'бриллиант',
    'паспорт', 'банковская карта', 'карта', 'животное', 'растение',
    'алкоголь', 'сигареты', 'табак',
  ];

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async moderateTask(taskId: string, moderatorId: string, dto: ModerateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['sender'],
    });

    if (!task) {
      throw new NotFoundException('Задание не найдено');
    }

    // Проверка на запрещенные слова
    const textToCheck = `${task.title} ${task.description}`.toLowerCase();
    const hasForbiddenKeywords = this.forbiddenKeywords.some(keyword =>
      textToCheck.includes(keyword.toLowerCase())
    );

    if (hasForbiddenKeywords && dto.approved) {
      throw new ForbiddenException('Задание содержит запрещенные предметы');
    }

    task.status = dto.approved ? TaskStatus.ACTIVE : TaskStatus.REJECTED;
    task.moderatedBy = moderatorId;
    task.moderatedAt = new Date();
    if (dto.comment) {
      task.moderationComment = dto.comment;
    }

    return this.taskRepository.save(task);
  }

  async getPendingTasks(): Promise<Task[]> {
    return this.taskRepository.find({
      where: { status: TaskStatus.PENDING_MODERATION },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async getAllTasks(skip = 0, take = 20): Promise<{ tasks: Task[]; total: number }> {
    const [tasks, total] = await this.taskRepository.findAndCount({
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { tasks, total };
  }

  async getAllOrders(skip = 0, take = 20): Promise<{ orders: Order[]; total: number }> {
    const [orders, total] = await this.orderRepository.findAndCount({
      relations: ['task', 'sender', 'carrier'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return { orders, total };
  }

  async blockUser(moderatorId: string, dto: BlockUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Нельзя заблокировать администратора');
    }

    user.status = UserStatus.BLOCKED;
    return this.userRepository.save(user);
  }

  async unblockUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  async getDisputeOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status: OrderStatus.DISPUTE },
      relations: ['task', 'sender', 'carrier', 'messages'],
      order: { createdAt: 'DESC' },
    });
  }

  async resolveDispute(orderId: string, moderatorId: string, refund: boolean): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    if (order.status !== OrderStatus.DISPUTE) {
      throw new ForbiddenException('Заказ не находится в статусе спора');
    }

    if (refund) {
      // Возврат средств отправителю
      // Здесь должна быть логика возврата через платежную систему
      order.status = OrderStatus.CANCELLED;
    } else {
      // Подтверждение платежа курьеру
      // Здесь должна быть логика подтверждения платежа
      order.status = OrderStatus.COMPLETED;
    }

    return this.orderRepository.save(order);
  }
}

