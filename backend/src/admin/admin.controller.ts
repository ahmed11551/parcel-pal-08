import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ModerateTaskDto } from './dto/moderate-task.dto';
import { BlockUserDto } from './dto/block-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tasks/pending')
  @ApiOperation({ summary: 'Получить задания на модерацию' })
  async getPendingTasks(@Request() req) {
    // Проверка прав администратора должна быть в guard
    return this.adminService.getPendingTasks();
  }

  @Post('tasks/:id/moderate')
  @ApiOperation({ summary: 'Модерировать задание' })
  async moderateTask(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ModerateTaskDto,
  ) {
    return this.adminService.moderateTask(id, req.user.id, dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Получить все задания' })
  async getAllTasks(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.adminService.getAllTasks(skip || 0, take || 20);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Получить все заказы' })
  async getAllOrders(@Query('skip') skip?: number, @Query('take') take?: number) {
    return this.adminService.getAllOrders(skip || 0, take || 20);
  }

  @Post('users/block')
  @ApiOperation({ summary: 'Заблокировать пользователя' })
  async blockUser(@Request() req, @Body() dto: BlockUserDto) {
    return this.adminService.blockUser(req.user.id, dto);
  }

  @Put('users/:id/unblock')
  @ApiOperation({ summary: 'Разблокировать пользователя' })
  async unblockUser(@Param('id') id: string) {
    return this.adminService.unblockUser(id);
  }

  @Get('orders/disputes')
  @ApiOperation({ summary: 'Получить спорные заказы' })
  async getDisputeOrders() {
    return this.adminService.getDisputeOrders();
  }

  @Post('orders/:id/resolve-dispute')
  @ApiOperation({ summary: 'Разрешить спор' })
  async resolveDispute(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { refund: boolean },
  ) {
    return this.adminService.resolveDispute(id, req.user.id, body.refund);
  }
}

