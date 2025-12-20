import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Отправить сообщение' })
  async create(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.create(req.user.id, createMessageDto);
  }

  @Get('orders/:orderId/messages')
  @ApiOperation({ summary: 'Получить сообщения чата' })
  async findAll(@Request() req, @Param('orderId') orderId: string) {
    return this.chatService.findAll(orderId, req.user.id);
  }

  @Put('orders/:orderId/read')
  @ApiOperation({ summary: 'Пометить сообщения как прочитанные' })
  async markAsRead(@Request() req, @Param('orderId') orderId: string) {
    await this.chatService.markAsRead(orderId, req.user.id);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Получить количество непрочитанных сообщений' })
  async getUnreadCount(@Request() req) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { count };
  }
}

