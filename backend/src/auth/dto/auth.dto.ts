import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendCodeDto {
  @ApiProperty({ example: '+79991234567', description: 'Номер телефона' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyCodeDto {
  @ApiProperty({ example: '+79991234567', description: 'Номер телефона' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '1234', description: 'Код из SMS' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'Код должен состоять из 4 цифр' })
  code: string;
}

