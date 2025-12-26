import { Body, Controller,Post, Req, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService){}

    @Post('signup')
    Signup(@Body() dto: RegisterDto){
        return this.authService.signup(dto)
    }

    @Post('login')
    Login(@Body() dto:LoginDto){
        return this.authService.login(dto)
    }
    
    @UseGuards(JwtAuthGuard)
    @Post('reset-password')
    async resetPassword(
    @Req() req,
    @Body() dto: ResetPasswordDto,
  ) {
    const userId = req.user.userId;
    return this.authService.resetPassword(userId, dto);
  }

}
