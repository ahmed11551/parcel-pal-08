import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SendCodeDto, VerifyCodeDto } from './dto/auth.dto';
import { SocialAuthDto } from './dto/social-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @ApiOperation({ summary: 'Отправить код верификации на телефон' })
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendVerificationCode(dto.phone);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Подтвердить код и получить токен' })
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.phone, dto.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить текущего пользователя' })
  async getMe(@Request() req) {
    return req.user;
  }

  @Post('social')
  @ApiOperation({ summary: 'Верификация через соцсеть (Telegram/VK)' })
  async verifySocial(@Body() socialAuthDto: SocialAuthDto) {
    return this.authService.verifySocial(socialAuthDto);
  }
}

