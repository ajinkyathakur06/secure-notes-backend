import { IsString, MinLength } from "class-validator";

export class CreateNoteDto {
  @IsString()
  @MinLength(1, { message: 'Note title cannot be empty' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Note content cannot be empty' })
  content: string;
}
