import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;
  private useS3: boolean;

  constructor(private configService: ConfigService) {
    // Поддержка AWS S3, Yandex Object Storage и Timeweb Cloud S3
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || 
                       this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 
                           this.configService.get<string>('S3_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION') || 
                  this.configService.get<string>('S3_REGION', 'ru-1');
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT') || 
                    this.configService.get<string>('S3_ENDPOINT');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 
                     this.configService.get<string>('S3_BUCKET_NAME', 'sendbuddy');

    if (accessKeyId && secretAccessKey) {
      this.useS3 = true;
      this.s3Client = new S3Client({
        region,
        endpoint: endpoint || undefined,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: endpoint ? true : false, // для Yandex Object Storage и Timeweb Cloud S3
      });
    } else {
      this.useS3 = false;
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // Проверка типа файла (только изображения)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Разрешены только изображения (JPEG, PNG, WebP)');
    }

    // Проверка размера (макс. 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Размер файла не должен превышать 5MB');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    if (this.useS3 && this.s3Client) {
      // Загрузка в S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      // Формируем URL
      const publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || 
                       this.configService.get<string>('AWS_S3_PUBLIC_URL');
      
      if (publicUrl) {
        return `${publicUrl}/${fileName}`;
      }
      
      // Для Timeweb Cloud S3
      const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT') || 
                      this.configService.get<string>('S3_ENDPOINT');
      if (endpoint) {
        return `${endpoint}/${this.bucketName}/${fileName}`;
      }
      
      // Для AWS S3
      const region = this.configService.get<string>('AWS_REGION') || 
                    this.configService.get<string>('S3_REGION', 'us-east-1');
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    } else {
      // Локальное хранение (для разработки)
      // В продакшене обязательно использовать S3 или аналоги
      throw new BadRequestException('Файловое хранилище не настроено');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.useS3 || !this.s3Client) {
      return;
    }

    try {
      // Извлекаем ключ из URL
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(-2).join('/'); // folder/filename

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      // Игнорируем ошибки при удалении
      console.error('Error deleting file:', error);
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder = 'uploads'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
}

