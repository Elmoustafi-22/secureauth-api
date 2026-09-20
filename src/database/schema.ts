import { uniqueIndex } from 'drizzle-orm/pg-core';
import { numeric } from 'drizzle-orm/pg-core';
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  index,
  jsonb
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',
  'withdrawal',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'reversed',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerifiedAt: timestamp('email_verified_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    refreshTokenHash: varchar('refresh_token_hash', {
      length: 255,
    }).notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
    }),

    replacedBySessionId: uuid('replaced_by_session_id'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  balance: numeric('balance', {
    precision: 15,
    scale: 2,
  })
    .notNull()
    .default('0.00'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),

  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, {
      onDelete: 'restrict',
    }),

  type: transactionTypeEnum('type').notNull(),

  status: transactionStatusEnum('status').notNull().default('pending'),

  amount: numeric('amount', {
    precision: 15,
    scale: 2,
  }).notNull(),

  balanceBefore: numeric('balance_before', {
    precision: 15,
    scale: 2,
  }).notNull(),

  balanceAfter: numeric('balance_after', {
    precision: 15,
    scale: 2,
  }).notNull(),

  reference: varchar('reference', {
    length: 100,
  })
    .notNull()
    .unique(),

  description: varchar('description', {
    length: 255,
  }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});


export const idempotencyKeys = pgTable('idempotency_keys',
  {
    id: uuid('id')
      .defaultRandom()
      .primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    key: varchar('key', {
      length: 255,
    }).notNull(),

    status: varchar('status', {
      length: 20,
    }).notNull().default('processing'),

    reponse: jsonb('response'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    }).notNull().defaultNow(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),

  }, (table) => ({

    userKeyUnique: uniqueIndex(
      'idempontency_user_key_unique',
    ).on(table.userId, table.key)
  }))