import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BlogResolver } from './blog.resolver';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationsModule],
  providers: [BlogResolver, BlogService],
})
export class BlogModule {}
