import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['givenReviews', 'receivedReviews'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    Object.assign(user, updateUserDto);
    
    return this.userRepository.save(user);
  }

  async updateRating(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['receivedReviews'],
    });

    if (!user || !user.receivedReviews || user.receivedReviews.length === 0) {
      return;
    }

    const totalRating = user.receivedReviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    user.rating = totalRating / user.receivedReviews.length;

    await this.userRepository.save(user);
  }
}

