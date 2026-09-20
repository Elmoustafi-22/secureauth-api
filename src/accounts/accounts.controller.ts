import { Controller, Post, UseGuards, Req, Body, Get, Headers } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { WithdrawDto } from './dto/withdraw.dto';
import { AccountsService } from './accounts.service';

@ApiTags('Accounts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountsService) { }

  @Post('create')
  @ApiOperation({ summary: 'Create account', description: 'Create a new financial account for the authenticated user.' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Req() request: AuthenticatedRequest) {
    return this.accountService.createForUser(request.user.userId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds', description: 'Withdraw an amount from the authenticated user\'s account. Requires an Idempotency-Key header to prevent duplicate transactions.' })
  @ApiHeader({ name: 'idempotency-key', description: 'Unique key to ensure the withdrawal is processed only once', required: true, example: 'wd-20260920-001' })
  @ApiResponse({ status: 200, description: 'Withdrawal successful — returns updated balance and transaction details' })
  @ApiResponse({ status: 400, description: 'Invalid amount, missing idempotency key, or insufficient funds' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  withdraw(
    @Req() request: AuthenticatedRequest,
    @Body() dto: WithdrawDto,
    @Headers('idempotency-key') idempotencyKey: string
  ) {
    return this.accountService.withdraw(
      request.user.userId,
      dto.amount,
      idempotencyKey,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transactions', description: 'List all transactions for the authenticated user\'s account, ordered by most recent.' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTransactions(@Req() request: AuthenticatedRequest) {
    return this.accountService.findTransactions(request.user.userId)
  }
}
