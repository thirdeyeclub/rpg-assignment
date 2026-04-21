import { Global, Module } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { join } from 'path';
import * as schema from './schema';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');
export type DrizzleDb = BetterSQLite3Database<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_DB,
      useFactory: () => {
        const sqlite = new Database(join(process.cwd(), 'dev.sqlite'));
        sqlite.pragma('foreign_keys = ON');
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
          );
        `);
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS blog (
            id TEXT PRIMARY KEY NOT NULL,
            subject TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            FOREIGN KEY (author_id) REFERENCES users(id)
          );
        `);
        return drizzle(sqlite, { schema });
      },
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DbModule {}
