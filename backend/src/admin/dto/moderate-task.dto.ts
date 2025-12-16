import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModerateTaskDto {
  @ApiProperty({ description: 'Одобрить задание' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Комментарий модератора' })
  @IsOptional()
  @IsString()
  comment?: string;
}

