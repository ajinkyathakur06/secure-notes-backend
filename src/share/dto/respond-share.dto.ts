import { IsEnum, IsUUID } from 'class-validator';

export class RespondShareDto {
  @IsUUID()
  requestId: string;

  @IsEnum(['ACCEPT', 'REJECT'])
  action: 'ACCEPT' | 'REJECT';
}
