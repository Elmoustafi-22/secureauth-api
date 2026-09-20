import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../database/database.provider';
import type { Database } from 'src/database/database.types';
import { idempotencyKeys } from 'src/database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class IdempotencyService {
    constructor(@Inject(DATABASE) private readonly db: Database) { }

    async find(
        userId: string,
        key: string,
    ) {
        const [record] = await this.db
            .select()
            .from(idempotencyKeys)
            .where(
                and(
                    eq(idempotencyKeys.userId, userId),
                    eq(idempotencyKeys.key, key),
                ),
            )
            .limit(1);

        return record;
    }
}
