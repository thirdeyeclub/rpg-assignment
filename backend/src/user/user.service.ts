import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE_DB, type DrizzleDb } from '../db/db.module';
import { UserRow, usersTable } from '../db/schema';
import { UserModel } from './dto/user.model';

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const rows = await this.db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const rows = await this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async register(email: string, password: string): Promise<UserModel> {
    if (await this.findByEmail(email)) throw new BadRequestException('Email already in use');

    const now = Math.floor(Date.now() / 1000);
    const id = randomUUID();
    await this.db.insert(usersTable).values({
      id,
      email,
      password: await bcrypt.hash(password, 10),
      createdAt: now,
      updatedAt: now,
    });
    return { id, email, createdAt: now, updatedAt: now };
  }

  toUserModel(user: Pick<UserRow, 'id' | 'email' | 'createdAt' | 'updatedAt'>): UserModel {
    return { id: user.id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt };
  }
}
