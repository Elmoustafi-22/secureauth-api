import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.provider';
import type { Database } from 'src/database/database.types';
import { sessions } from '../database/schema';

@Injectable()
export class SessionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async createSession(userId: string, expiresAt: Date) {
    const refreshSecret = randomBytes(64).toString('hex');

    const refreshTokenHash = await argon2.hash(refreshSecret);
    const [session] = await this.db
      .insert(sessions)
      .values({
        userId,
        refreshTokenHash,
        expiresAt,
      })
      .returning({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      });

    const refreshToken = `${session.id}.${refreshSecret}`;

    return {
      session,
      refreshToken,
    };
  }

  async findById(id: string) {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    return session;
  }

  async validateRefreshToken(sessionId: string, refreshSecret: string) {
    const session = await this.findById(sessionId);

    if (!session) {
      return null;
    }

    if (session.revokedAt) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const valid = await argon2.verify(session.refreshTokenHash, refreshSecret);

    if (!valid) {
      return null;
    }

    return session;
  }

  async revokeSession(sessionId: string) {
    await this.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
  }

  async rotateSession(sessionId: string, userId: string, expiresAt: Date) {
    return this.db.transaction(async (tx) => {
      await tx
        .update(sessions)
        .set({
          revokedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));

      const refreshSecret = randomBytes(64).toString('hex');

      const refreshTokenHash = await argon2.hash(refreshSecret);

      const [newSession] = await tx
        .insert(sessions)
        .values({
          userId,
          refreshTokenHash,
          expiresAt,
        })
        .returning({
          id: sessions.id,
          userId: sessions.userId,
          expiresAt: sessions.expiresAt,
        });
      await tx
        .update(sessions)
        .set({
          replacedBySessionId: newSession.id,
        })
        .where(eq(sessions.id, sessionId));

      return {
        session: newSession,
        refreshToken: `${newSession.id}.${refreshSecret}`,
      };
    });
  }

  async revokeAllUserSession(userId: string) {
    await this.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
      })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}
