import {IsEmail,IsString,MinLength,Matches} from  'class-validator';
export class RegisterDto{
    @IsEmail()
    email : string 

    @IsString()
    @MinLength(3) 
    name : string

    @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long and contain uppercase, lowercase,number and special character',
    },
  )
  password: string;

}