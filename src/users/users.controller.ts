import { Controller, Body, Post, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    createUser(@Body() dto: CreateUserDto) {
        return this.usersService.createUser(dto)
    }

    @Get(':id')
    findById(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.usersService.findById(id)
    }
}
