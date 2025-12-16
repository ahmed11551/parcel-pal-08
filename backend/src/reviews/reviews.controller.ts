import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать отзыв' })
  async create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить отзывы пользователя' })
  async findAll(@Param('userId') userId: string) {
    return this.reviewsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить отзыв по ID' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}

