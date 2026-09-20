import { Controller, Body, Post, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedRequest } from './types/authenticated-request';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Authenticate with email and password. Returns an access token and a refresh token.' })
  @ApiResponse({ status: 200, description: 'Login successful — returns access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register', description: 'Create a new user account.' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh tokens', description: 'Exchange a valid refresh token for a new access token and rotated refresh token.' })
  @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string', description: 'The refresh token from login or previous refresh', example: 'session-uuid.hex-secret' } }, required: ['refreshToken'] } })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout all sessions', description: 'Revoke all active sessions for the authenticated user.' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logoutAll(@Req() request: AuthenticatedRequest) {
    return this.authService.logoutAll(request.user.userId);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout', description: 'Revoke a single session by its refresh token.' })
  @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string', description: 'The refresh token to revoke', example: 'session-uuid.hex-secret' } }, required: ['refreshToken'] } })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user', description: 'Returns the authenticated user\'s profile from the JWT payload.' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Req() request: any) {
    return request.user;
  }
}
