import { IsEnum, IsString, IsUUID } from 'class-validator';

export class CreateShareDto {
  @IsUUID()
  noteId: string;

  @IsString()
  receiverEmail: string;

  @IsEnum(['READ_ONLY', 'EDIT'])
  permission: 'READ_ONLY' | 'EDIT';
}
