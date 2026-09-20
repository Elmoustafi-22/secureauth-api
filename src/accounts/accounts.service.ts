import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE } from '../database/database.provider';
import type { Database } from 'src/database/database.types';
import { accounts, transactions } from 'src/database/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface LockedAccount {
  id: string;
  user_id: string;
  balance: string;
}

@Injectable()
export class AccountsService {
  constructor(@Inject(DATABASE) private readonly db: Database) { }

  async createForUser(userId: string) {
    const [account] = await this.db
      .insert(accounts)
      .values({
        userId,
      })
      .returning();

    return account;
  }

  async withdraw(userId: string, amount: number, idempotencyKey: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header is required',
      );
    }

    return this.db.transaction(async (tx) => {
      // const result = await tx.execute(
      //     sql`
      //         SELECT id, user_id, balance
      //         FROM accounts
      //         WHERE user_id = ${userId}
      //         FOR UPDATE
      //     `
      // );

      // const account = result.rows[0] as unknown as LockedAccount | undefined;

      const [account] = await tx
        .select({
          id: accounts.id,
          userId: accounts.userId,
          balance: accounts.balance,
        })
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .for('update');

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const balanceBefore = Number(account.balance);

      if (balanceBefore < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      const balanceAfter = balanceBefore - amount;

      await tx
        .update(accounts)
        .set({
          balance: balanceAfter.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, account.id));

      const [transaction] = await tx
        .insert(transactions)
        .values({
          accountId: account.id,
          type: 'withdrawal',
          status: 'completed',
          amount: amount.toFixed(2),
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          reference: `WD_${randomUUID()}`,
          description: 'Account withdrawal',
        })
        .returning();

      return {
        balance: balanceAfter.toFixed(2),
        transaction,
      };
    });
  }

  async findTransactions(userId: string) {
    const result = await this.db
      .select({
        id: transactions.id,
        type: transactions.type,
        status: transactions.status,
        amount: transactions.amount,
        balanceBefore: transactions.balanceBefore,
        balanceAfter: transactions.balanceAfter,
        reference: transactions.reference,
        description: transactions.description,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(eq(accounts.userId, userId))
      .orderBy(desc(transactions.createdAt));

    return result;
  }
}
