import { IsEmail, IsNotEmpty, IsString, Max, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    lastName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}