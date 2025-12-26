import { IsEmail, IsEnum, IsUUID } from 'class-validator';

export class CreateShareDto {
  @IsUUID()
  noteId: string;

  @IsEmail()
  receiverEmail: string;

  @IsEnum(['READ_ONLY', 'EDIT'])
  permission: 'READ_ONLY' | 'EDIT';
}
