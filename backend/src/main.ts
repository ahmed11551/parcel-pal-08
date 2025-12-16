import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// @ts-ignore - helmet не имеет типов для NestJS
const helmet = require('helmet');

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Helmet для security headers
    app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SendBuddy API')
    .setDescription('P2P Delivery Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

    // Валидация обязательных переменных окружения
    const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.error(`Отсутствуют обязательные переменные окружения: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    logger.log(`✅ Приложение запущено на http://localhost:${port}`);
    logger.log(`📚 Swagger документация: http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error('❌ Ошибка при запуске приложения:', error);
    process.exit(1);
  }
}

bootstrap();

