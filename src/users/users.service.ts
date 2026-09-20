import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE } from '../database/database.provider';
import type { Database } from 'src/database/database.types';
import { CreateUserInput } from './types/create-user.input';
import { users } from 'src/database/schema';
import { eq, and, asc, count, desc, ilike, or, SQL } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async createUser(input: CreateUserInput) {
    const [user] = await this.db
      .insert(users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        createdAt: users.createdAt,
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
        role: users.role,
        isActive: users.isActive,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async findAll(query: QueryUsersDto) {
    const {
      search,
      role,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * limit;

    const filters: (SQL | undefined)[] = [];

    if (search) {
      filters.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
        ),
      );
    }

    if (role) {
      filters.push(eq(users.role, role));
    }

    const orderBy = sortBy === 'email' ? users.email : users.createdAt;

    const orderExpression = sortOrder === 'asc' ? asc(orderBy) : desc(orderBy);

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderExpression)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await this.db
      .select({
        total: count(),
      })
      .from(users)
      .where(filters.length > 0 ? and(...filters) : undefined);

    const totalPages = Math.ceil(Number(total) / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total: Number(total),
        totalPages,
      },
    };
  }
}
