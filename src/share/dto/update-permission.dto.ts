import { IsEnum, IsUUID } from 'class-validator';

export class UpdatePermissionDto {
  @IsUUID()
  noteId: string;

  @IsUUID()
  userId: string;

  @IsEnum(['READ_ONLY', 'EDIT'])
  permission: 'READ_ONLY' | 'EDIT';
}
