import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { SessionsService } from './sessions.service';

@Module({
  imports: [DatabaseModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
