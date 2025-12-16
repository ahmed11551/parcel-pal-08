import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationMethod } from '../../users/entities/user.entity';

export class SocialAuthDto {
  @ApiProperty({ description: 'ID пользователя в соцсети' })
  @IsString()
  @IsNotEmpty()
  socialId: string;

  @ApiProperty({ description: 'Провайдер', enum: VerificationMethod })
  @IsEnum(VerificationMethod)
  provider: VerificationMethod;

  @ApiProperty({ description: 'Имя пользователя' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL аватара', required: false })
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'Номер телефона (для привязки)' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

