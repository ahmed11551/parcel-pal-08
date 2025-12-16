import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID задания' })
  @IsString()
  taskId: string;

  @ApiPropertyOptional({ description: 'Сообщение курьера при отклике' })
  @IsOptional()
  @IsString()
  carrierMessage?: string;
}

