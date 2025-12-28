const pdf = require('pdf-parse')
import * as mammoth from 'mammoth'

export async function extractTextFromFile(
  file: Express.Multer.File,
): Promise<string> {
  const mimeType = file.mimetype

  // TXT
  if (mimeType === 'text/plain') {
    return file.buffer.toString('utf-8')
  }

  // PDF
  if (mimeType === 'application/pdf') {
    const data = await pdf(file.buffer)
    return data.text
  }

  // DOCX
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    })
    return result.value
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}
