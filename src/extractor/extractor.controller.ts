import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ExtractorService } from './extractor.service'

@Controller('extractor')
export class ExtractorController {
  constructor(private readonly extractorService: ExtractorService) {}

  /**
   * Upload a file (pdf / docx / txt),
   * extract text and save it as a Note
   */
  @Post('note')
  @UseInterceptors(FileInterceptor('file'))
  async extractFileAndCreateNote(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('title') title: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    if (!userId) {
      throw new BadRequestException('User ID is required')
    }

    if (!title) {
      throw new BadRequestException('Title is required')
    }

    return this.extractorService.extractAndCreateNote({
      file,
      userId,
      title,
    })
  }
}
