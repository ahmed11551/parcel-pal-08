import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    // Валидация стоимости
    if (createTaskDto.estimatedValue && createTaskDto.estimatedValue > 10000) {
      throw new BadRequestException('Оценочная стоимость не может превышать 10 000 ₽');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      senderId: userId,
      status: TaskStatus.PENDING_MODERATION,
    });

    return this.taskRepository.save(task);
  }

  async findAll(filters: GetTasksDto): Promise<{ tasks: Task[]; total: number }> {
    const where: FindOptionsWhere<Task> = {
      status: TaskStatus.ACTIVE,
    };

    if (filters.fromAirport) {
      where.fromAirport = filters.fromAirport;
    }

    if (filters.toAirport) {
      where.toAirport = filters.toAirport;
    }

    if (filters.dateFrom) {
      where.dateFrom = filters.dateFrom as any;
    }

    const [tasks, total] = await this.taskRepository.findAndCount({
      where,
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: filters.skip || 0,
      take: filters.take || 20,
    });

    return { tasks, total };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['sender', 'orders', 'orders.carrier'],
    });

    if (!task) {
      throw new NotFoundException('Задание не найдено');
    }

    return task;
  }

  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (task.senderId !== userId) {
      throw new ForbiddenException('Вы можете редактировать только свои задания');
    }

    if (task.status !== TaskStatus.PENDING_MODERATION && task.status !== TaskStatus.ACTIVE) {
      throw new BadRequestException('Нельзя редактировать задание в текущем статусе');
    }

    Object.assign(task, updateTaskDto);
    
    // Если изменены важные поля, требуется повторная модерация
    if (updateTaskDto.title || updateTaskDto.description || updateTaskDto.photos) {
      task.status = TaskStatus.PENDING_MODERATION;
    }

    return this.taskRepository.save(task);
  }

  async moderate(id: string, approved: boolean, moderatorId: string, comment?: string): Promise<Task> {
    const task = await this.findOne(id);

    task.status = approved ? TaskStatus.ACTIVE : TaskStatus.REJECTED;
    task.moderatedBy = moderatorId;
    task.moderatedAt = new Date();
    if (comment) {
      task.moderationComment = comment;
    }

    return this.taskRepository.save(task);
  }

  async cancel(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    if (task.senderId !== userId) {
      throw new ForbiddenException('Вы можете отменять только свои задания');
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('Нельзя отменить задание в текущем статусе');
    }

    task.status = TaskStatus.CANCELLED;
    return this.taskRepository.save(task);
  }

  async getResponses(taskId: string, userId: string): Promise<Order[]> {
    const task = await this.findOne(taskId);

    if (task.senderId !== userId) {
      throw new ForbiddenException('Только отправитель может просматривать отклики');
    }

    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.taskId = :taskId', { taskId })
      .andWhere('order.status != :status', { status: 'cancelled' })
      .leftJoinAndSelect('order.carrier', 'carrier')
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }
}

