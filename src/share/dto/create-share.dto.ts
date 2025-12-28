import { IsEnum, IsUUID } from 'class-validator';

export class CreateShareDto {
  @IsUUID()
  noteId: string;

  @IsUUID()
  receiverId: string;

  @IsEnum(['READ_ONLY', 'EDIT'])
  permission: 'READ_ONLY' | 'EDIT';
}
