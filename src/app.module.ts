import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { AccountsModule } from './accounts/accounts.module';
import { IdempotencyModule } from './idempotency/idempotency.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    AccountsModule,
    IdempotencyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
