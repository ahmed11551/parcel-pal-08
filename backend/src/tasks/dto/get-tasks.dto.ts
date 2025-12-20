import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTasksDto {
  @ApiPropertyOptional({ description: 'Код аэропорта отправления' })
  @IsOptional()
  @IsString()
  fromAirport?: string;

  @ApiPropertyOptional({ description: 'Код аэропорта назначения' })
  @IsOptional()
  @IsString()
  toAirport?: string;

  @ApiPropertyOptional({ description: 'Дата от (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Количество пропустить', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ description: 'Количество взять', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}

