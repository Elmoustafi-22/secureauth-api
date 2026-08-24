import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE } from '../database/database.provider'
import type { Database } from 'src/database/database.types';
import { CreateUserDto } from './dto/create-user.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
    constructor(@Inject(DATABASE) private readonly db: Database) { }

    async createUser(dto: CreateUserDto) {
        const existingUser = await this.db
            .select()
            .from(users)
            .where(eq(users.email, dto.email))
            .limit(1);

        if (existingUser.length > 0) {
            throw new ConflictException('Email already exists');
        }

        const passwordHash = await argon2.hash(dto.password)

        const [user] = await this.db
            .insert(users)
            .values({
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName
            })
            .returning({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
            });

        return user;
    }

    async findById(id: string) {
        const [user] = await this.db
            .select({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                isActive: users.isActive,
                emailVerifiedAt: users.emailVerifiedAt,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, id))
            .limit(1)
        if (!user) {
            throw new NotFoundException('User not found')
        }
        return user;
    }

}
