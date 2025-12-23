import { Body, Controller,Post} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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

}
