import { Controller, MessageEvent, Req, Sse, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Sse()
  notifications(@Req() req: Request): Observable<MessageEvent> {
    const userId = (req.user as { userId: string }).userId;
    return this.notificationsService.streamBlogPublishedEvents(userId);
  }
}
