import { Injectable, MessageEvent } from '@nestjs/common';
import type { UUID } from 'node:crypto';
import { Observable, Subject, filter, map } from 'rxjs';

export interface BlogPublishedEvent {
  blogId: UUID;
  authorId: string;
  authorEmail: string;
}

@Injectable()
export class NotificationsService {
  private readonly blogEventsSubject = new Subject<BlogPublishedEvent>();

  emitBlogPublished(event: BlogPublishedEvent): void {
    this.blogEventsSubject.next(event);
  }

  streamBlogPublishedEvents(userId: string): Observable<MessageEvent> {
    return this.blogEventsSubject.pipe(
      filter((event) => event.authorId !== userId),
      map((event) => ({
        type: 'blog-published',
        data: JSON.stringify({
          blogId: event.blogId,
          authorId: event.authorId,
          authorEmail: event.authorEmail,
        }),
      })),
    );
  }
}
