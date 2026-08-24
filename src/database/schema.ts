import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    emailVerifiedAt: timestamp('email_verified_at', {
        withTimezone: true,
    }),
    createdAt: timestamp('created_at', {
        withTimezone: true
    }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {
        withTimezone: true
    }).notNull().defaultNow(),
})