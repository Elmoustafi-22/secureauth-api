import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';

export const DATABASE = Symbol('DATABASE');

export const databaseProvider: Provider = {
  provide: DATABASE,
  useFactory: () => {
    const isLocal =
      !process.env.DATABASE_URL ||
      process.env.DATABASE_URL.includes('localhost') ||
      process.env.DATABASE_URL.includes('127.0.0.1');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
    return drizzle(pool);
  },
};

