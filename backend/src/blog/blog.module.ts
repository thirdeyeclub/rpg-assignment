import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../user/user.module';
import { BlogResolver } from './blog.resolver';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationsModule, UserModule],
  providers: [BlogResolver, BlogService],
})
export class BlogModule {}
