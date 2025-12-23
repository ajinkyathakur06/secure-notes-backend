import { Injectable, BadRequestException } from '@nestjs/common'
import { extractTextFromFile } from './utils/extract-text.util'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ExtractorService {
  constructor(private readonly prisma: PrismaService) {}

  async extractAndCreateNote({
    file,
    userId,
    title,
  }: {
    file: Express.Multer.File
    userId: string
    title: string
  }) {
    const content = await extractTextFromFile(file)

    if (!content || !content.trim()) {
      throw new BadRequestException('No text could be extracted from file')
    }

    const note = await this.prisma.notes.create({
      data: {
        title,
        content,
        user_id: userId,
      },
    })

    return {
      message: 'Note created successfully',
      note,
    }
  }
}
