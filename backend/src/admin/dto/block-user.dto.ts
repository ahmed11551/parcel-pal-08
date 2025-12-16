import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockUserDto {
  @ApiProperty({ description: 'ID пользователя' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Причина блокировки' })
  @IsOptional()
  @IsString()
  reason?: string;
}

