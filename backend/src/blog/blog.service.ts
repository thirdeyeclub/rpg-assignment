import { Inject, Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
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
    const id = randomUUID();

    await this.db.insert(blogTable).values({ id, subject, content, authorId, createdAt });

    const blog: BlogModel = { id, subject, content, authorId, createdAt };
    this.notificationsService.emitBlogPublished(blog);
    return blog;
  }

  async getBlogs(): Promise<BlogModel[]> {
    const rows = await this.db.select().from(blogTable).orderBy(desc(blogTable.createdAt));
    return rows.map(({ id, subject, content, authorId, createdAt }) => ({
      id, subject, content, authorId, createdAt,
    }));
  }
}
