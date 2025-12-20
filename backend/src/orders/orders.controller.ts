import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Откликнуться на задание (для курьера)' })
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список заказов' })
  async findAll(@Request() req, @Query('role') role: 'sender' | 'carrier' = 'carrier') {
    return this.ordersService.findAll(req.user.id, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Put(':taskId/select-carrier/:orderId')
  @ApiOperation({ summary: 'Выбрать курьера из откликов (для отправителя)' })
  async selectCarrier(
    @Request() req,
    @Param('taskId') taskId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.selectCarrier(taskId, orderId, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Обновить статус заказа' })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, req.user.id, updateDto);
  }

  @Put(':id/package-received')
  @ApiOperation({ summary: 'Подтвердить получение посылки (для курьера)' })
  async markPackageReceived(@Request() req, @Param('id') id: string) {
    return this.ordersService.markPackageReceived(id, req.user.id);
  }

  @Put(':id/delivered')
  @ApiOperation({ summary: 'Подтвердить доставку (для курьера)' })
  async markDelivered(@Request() req, @Param('id') id: string) {
    return this.ordersService.markDelivered(id, req.user.id);
  }
}

