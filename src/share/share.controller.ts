import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { RespondShareDto } from './dto/respond-share.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('share')
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  createShare(@Req() req, @Body() dto: CreateShareDto) {
    return this.shareService.createShare(req.user.id, dto);
  }

  @Get('requests')
  getRequests(@Req() req) {
    return this.shareService.getPendingRequests(req.user.id);
  }

  @Post('respond')
  respond(@Req() req, @Body() dto: RespondShareDto) {
    return this.shareService.respondToRequest(req.user.id, dto);
  }

  @Patch('permission')
  updatePermission(@Req() req, @Body() dto: UpdatePermissionDto) {
    return this.shareService.updatePermission(req.user.id, dto);
  }

  @Delete('revoke/:noteId/:userId')
  revoke(@Req() req, @Param() params) {
    return this.shareService.revokeAccess(req.user.id, params);
  }
}
