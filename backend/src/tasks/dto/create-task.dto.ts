import { IsString, IsNotEmpty, IsEnum, IsInt, IsDateString, IsArray, IsOptional, Min, Max, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskSize } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ description: 'Название предмета' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Описание предмета' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URLs фотографий предмета', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  photos: string[];

  @ApiProperty({ description: 'Размер посылки', enum: TaskSize })
  @IsEnum(TaskSize)
  size: TaskSize;

  @ApiProperty({ description: 'Оценочная стоимость в рублях (макс. 10000)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  estimatedValue?: number;

  @ApiProperty({ description: 'Код аэропорта отправления (например, SVO)' })
  @IsString()
  @IsNotEmpty()
  fromAirport: string;

  @ApiProperty({ description: 'Точное место встречи в аэропорту отправления' })
  @IsString()
  @IsNotEmpty()
  fromPoint: string;

  @ApiProperty({ description: 'Код аэропорта назначения' })
  @IsString()
  @IsNotEmpty()
  toAirport: string;

  @ApiProperty({ description: 'Точное место встречи в аэропорту назначения' })
  @IsString()
  @IsNotEmpty()
  toPoint: string;

  @ApiProperty({ description: 'Желаемая дата отправления (ISO string)' })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({ description: 'Желаемая дата доставки (ISO string)' })
  @IsDateString()
  dateTo: string;

  @ApiProperty({ description: 'Вознаграждение курьеру в рублях' })
  @IsInt()
  @Min(1)
  reward: number;
}

