import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, VerificationMethod } from '../users/entities/user.entity';
import { SmsService } from './services/sms.service';
import { SocialAuthDto } from './dto/social-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async sendVerificationCode(phone: string): Promise<{ success: boolean }> {
    // Нормализация номера телефона
    const normalizedPhone = this.normalizePhone(phone);
    
    // Генерация 4-значного кода
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Поиск или создание пользователя
    let user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      user = this.userRepository.create({
        phone: normalizedPhone,
        status: UserStatus.PENDING_VERIFICATION,
      });
    }

    // Сохранение кода
    user.verificationCode = code;
    user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    await this.userRepository.save(user);

    // Отправка SMS (в dev режиме можно просто логировать)
    if (process.env.NODE_ENV === 'production') {
      await this.smsService.sendSms(normalizedPhone, `Ваш код для SendBuddy: ${code}`);
    } else {
      console.log(`[DEV] SMS code for ${normalizedPhone}: ${code}`);
    }

    return { success: true };
  }

  async verifyCode(phone: string, code: string): Promise<{ user: User; accessToken: string }> {
    const normalizedPhone = this.normalizePhone(phone);
    
    const user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new UnauthorizedException('Неверный код');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('Код истек');
    }

    // Обновление статуса
    user.isPhoneVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      user.status = UserStatus.ACTIVE;
    }

    await this.userRepository.save(user);

    // Генерация JWT токена
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Пользователь не найден или заблокирован');
    }

    return user;
  }

  private normalizePhone(phone: string): string {
    // Удаляем все нецифровые символы
    let cleaned = phone.replace(/\D/g, '');
    
    // Если начинается с 8, заменяем на 7
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.substring(1);
    }
    
    // Если не начинается с 7, добавляем
    if (!cleaned.startsWith('7')) {
      cleaned = '7' + cleaned;
    }

    return '+' + cleaned;
  }

  async verifySocial(socialAuthDto: SocialAuthDto): Promise<{ user: User; accessToken: string }> {
    const normalizedPhone = this.normalizePhone(socialAuthDto.phone);

    // Проверяем, существует ли пользователь с таким телефоном
    let user = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    // Проверяем, не привязан ли уже этот соц. аккаунт к другому пользователю
    const existingSocialUser = await this.userRepository.findOne({
      where: {
        socialId: socialAuthDto.socialId,
        socialProvider: socialAuthDto.provider === VerificationMethod.TELEGRAM ? 'telegram' : 'vk',
      },
    });

    if (existingSocialUser && existingSocialUser.phone !== normalizedPhone) {
      throw new BadRequestException('Этот аккаунт уже привязан к другому номеру телефона');
    }

    if (!user) {
      // Создаем нового пользователя
      user = this.userRepository.create({
        phone: normalizedPhone,
        name: socialAuthDto.name,
        avatar: socialAuthDto.avatar,
        socialId: socialAuthDto.socialId,
        socialProvider: socialAuthDto.provider === VerificationMethod.TELEGRAM ? 'telegram' : 'vk',
        verificationMethod: socialAuthDto.provider,
        isPhoneVerified: true,
        status: UserStatus.ACTIVE,
      });
    } else {
      // Обновляем существующего пользователя
      user.name = socialAuthDto.name || user.name;
      user.avatar = socialAuthDto.avatar || user.avatar;
      user.socialId = socialAuthDto.socialId;
      user.socialProvider = socialAuthDto.provider === VerificationMethod.TELEGRAM ? 'telegram' : 'vk';
      user.verificationMethod = socialAuthDto.provider;
      user.isPhoneVerified = true;
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        user.status = UserStatus.ACTIVE;
      }
    }

    await this.userRepository.save(user);

    // Генерация JWT токена
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }
}

