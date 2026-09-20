import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { randomBytes } from 'crypto';
import { SessionsService } from 'src/sessions/sessions.service';
import { parseRefreshToken } from './utils/refresh-token.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  private async createAccessToken(user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const passwordMatches = argon2.verify(user.passwordHash, dto.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const accessToken = await this.createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    const { refreshToken } = await this.sessionsService.createSession(
      user.id,
      refreshTokenExpiresAt,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.userService.createUser({
      ...dto,
      passwordHash,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async refresh(refreshToken: string) {
    const parsed = parseRefreshToken(refreshToken);

    if (!parsed) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessionsService.validateRefreshToken(
      parsed.sessionId,
      parsed.refreshSecret,
    );

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(session.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    const rotated = await this.sessionsService.rotateSession(
      session.id,
      user.id,
      refreshTokenExpiresAt,
    );

    return {
      accessToken,
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const parsed = parseRefreshToken(refreshToken);

    if (!parsed) {
      return;
    }

    await this.sessionsService.revokeSession(parsed.sessionId);
  }

  async logoutAll(userId: string) {
    await this.sessionsService.revokeAllUserSession(userId);

    return {
      message: 'All sessions revoked',
    };
  }
}
