import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const sslEnabled = this.configService.get('DB_SSL') === 'true';
    const sslCaPath = this.configService.get('DB_SSL_CA');
    
    let sslConfig: any = false;
    
    if (sslEnabled) {
      if (sslCaPath && fs.existsSync(sslCaPath)) {
        try {
          const caCert = fs.readFileSync(sslCaPath).toString();
          sslConfig = {
            rejectUnauthorized: true,
            ca: caCert,
          };
        } catch (error) {
          console.warn('Failed to read SSL certificate, using rejectUnauthorized: false');
          sslConfig = {
            rejectUnauthorized: false,
          };
        }
      } else {
        // Если сертификат не найден, но SSL включен, используем без проверки (для разработки)
        console.warn('SSL certificate not found, using rejectUnauthorized: false');
        sslConfig = {
          rejectUnauthorized: false,
        };
      }
    }

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_DATABASE', 'sendbuddy'),
      ssl: sslConfig,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: this.configService.get('NODE_ENV') !== 'production',
      logging: this.configService.get('NODE_ENV') === 'development',
    };
  }
}

