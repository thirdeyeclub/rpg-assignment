import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { randomUUID, type UUID } from 'node:crypto';
import { DRIZZLE_DB, type DrizzleDb } from '../db/db.module';
import { blogTable } from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { BlogModel } from './dto/blog.model';

@Injectable()
export class BlogService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBlog(subject: string, content: string, authorId: string): Promise<BlogModel> {
    const createdAt = Math.floor(Date.now() / 1000);
    const id: UUID = randomUUID();

    await this.db.insert(blogTable).values({ id, subject, content, authorId, createdAt });

    const blog: BlogModel = { id, subject, content, authorId, createdAt };
    this.notificationsService.emitBlogPublished({ blogId: id, authorId });
    return blog;
  }

  async getBlogs(): Promise<BlogModel[]> {
    const rows = await this.db.select().from(blogTable).orderBy(desc(blogTable.createdAt));
    return rows.map(({ id, subject, content, authorId, createdAt }) => ({
      id, subject, content, authorId, createdAt,
    }));
  }

  async getBlogById(id: string): Promise<BlogModel | null> {
    const rows = await this.db.select().from(blogTable).where(eq(blogTable.id, id)).limit(1);
    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      subject: row.subject,
      content: row.content,
      authorId: row.authorId,
      createdAt: row.createdAt,
    };
  }
}
