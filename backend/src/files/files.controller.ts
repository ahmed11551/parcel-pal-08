import { Controller, Post, Delete, UseInterceptors, UploadedFile, UploadedFiles, Param, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Загрузить один файл' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const url = await this.filesService.uploadFile(file, 'tasks');
    return { url };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Загрузить несколько файлов' })
  @ApiConsumes('multipart/form-data')
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const urls = await this.filesService.uploadMultipleFiles(files, 'tasks');
    return { urls };
  }

  @Delete(':url')
  @ApiOperation({ summary: 'Удалить файл' })
  async deleteFile(@Param('url') url: string) {
    await this.filesService.deleteFile(decodeURIComponent(url));
    return { success: true };
  }
}

