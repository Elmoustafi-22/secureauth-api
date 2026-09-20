import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Database = ReturnType<typeof drizzle>;
