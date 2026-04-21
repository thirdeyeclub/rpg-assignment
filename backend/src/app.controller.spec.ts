import { UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { firstValueFrom, take, toArray } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import{ getJwtSecret } from './auth/jwt-secret';
import { BlogResolver } from './blog/blog.resolver';
import { BlogService } from './blog/blog.service';
import { NotificationsService } from './notifications/notifications.service';
import { UserService } from './user/user.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: { findByEmail: jest.Mock; toUserModel: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    userService = {
      findByEmail: jest.fn(),
      toUserModel: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    authService = new AuthService(
      userService as unknown as UserService,
      jwtService as unknown as JwtService,
    );
  });

  it('logs in with valid credentials', async () => {
    const password = 'pass123';
    const user = {
      id: 'user-1',
      email: 'dev@example.com',
      password: await bcrypt.hash(password, 10),
      createdAt: 100,
      updatedAt: 100,
    };
    userService.findByEmail.mockResolvedValue(user);
    userService.toUserModel.mockReturnValue({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    jwtService.signAsync.mockResolvedValue('token-1');

    const result = await authService.login(user.email, password);

    expect(result).toEqual({
      accessToken: 'token-1',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  });

  it('rejects invalid credentials', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'dev@example.com',
      password: await bcrypt.hash('other', 10),
      createdAt: 100,
      updatedAt: 100,
    });

    await expect(authService.login('dev@example.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('NotificationsService', () => {
  it('streams published blog events for SSE', async () => {
    const notificationsService = new NotificationsService();
    const event = {
      blogId: '123e4567-e89b-12d3-a456-426614174000',
      authorId: 'author-1',
      authorEmail: 'author@example.com',
    } as const;
    const nextEvent = firstValueFrom(
      notificationsService.streamBlogPublishedEvents('reader-1').pipe(take(1)),
    );
    notificationsService.emitBlogPublished(event);

    await expect(nextEvent).resolves.toEqual({
      type: 'blog-published',
      data: JSON.stringify({
        blogId: event.blogId,
        authorId: event.authorId,
        authorEmail: event.authorEmail,
      }),
    });
  });

  it('streams queued blog events in emission order', async () => {
    const notificationsService = new NotificationsService();
    const events = [
      {
        blogId: '00000000-0000-4000-8000-000000000001',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000002',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000003',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000004',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000005',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000006',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000007',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000008',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000009',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
      {
        blogId: '00000000-0000-4000-8000-000000000010',
        authorId: 'author-1',
        authorEmail: 'author@example.com',
      },
    ] as const;

    const streamedEventsPromise = firstValueFrom(
      notificationsService.streamBlogPublishedEvents('reader-1').pipe(take(events.length), toArray()),
    );

    events.forEach((event) => notificationsService.emitBlogPublished(event));

    await expect(streamedEventsPromise).resolves.toEqual(
      events.map((event) => ({
        type: 'blog-published',
        data: JSON.stringify({
          blogId: event.blogId,
          authorId: event.authorId,
          authorEmail: event.authorEmail,
        }),
      })),
    );
  });

  it('sends blog notifications to everyone except the author', () => {
    const notificationsService = new NotificationsService();
    const authorEvents: Array<{ type: string; data: string }> = [];
    const readerOneEvents: Array<{ type: string; data: string }> = [];
    const readerTwoEvents: Array<{ type: string; data: string }> = [];

    const authorSubscription = notificationsService
      .streamBlogPublishedEvents('author-1')
      .subscribe((event) => authorEvents.push(event as { type: string; data: string }));
    const readerOneSubscription = notificationsService
      .streamBlogPublishedEvents('reader-1')
      .subscribe((event) => readerOneEvents.push(event as { type: string; data: string }));
    const readerTwoSubscription = notificationsService
      .streamBlogPublishedEvents('reader-2')
      .subscribe((event) => readerTwoEvents.push(event as { type: string; data: string }));

    notificationsService.emitBlogPublished({
      blogId: '00000000-0000-4000-8000-000000000011',
      authorId: 'author-1',
      authorEmail: 'author@example.com',
    });

    expect(authorEvents).toEqual([]);
    expect(readerOneEvents).toEqual([
      {
        type: 'blog-published',
        data: JSON.stringify({
          blogId: '00000000-0000-4000-8000-000000000011',
          authorId: 'author-1',
          authorEmail: 'author@example.com',
        }),
      },
    ]);
    expect(readerTwoEvents).toEqual([
      {
        type: 'blog-published',
        data: JSON.stringify({
          blogId: '00000000-0000-4000-8000-000000000011',
          authorId: 'author-1',
          authorEmail: 'author@example.com',
        }),
      },
    ]);

    authorSubscription.unsubscribe();
    readerOneSubscription.unsubscribe();
    readerTwoSubscription.unsubscribe();
  });
});

describe('BlogResolver', () => {
  let blogResolver: BlogResolver;
  let blogService: {
    getBlogs: jest.Mock;
    getBlogById: jest.Mock;
    createBlog: jest.Mock;
  };
  let userService: { findById: jest.Mock };

  beforeEach(async () => {
    blogService = {
      getBlogs: jest.fn(),
      getBlogById: jest.fn(),
      createBlog: jest.fn(),
    };
    userService = { findById: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BlogResolver,
        { provide: BlogService, useValue: blogService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    blogResolver = moduleRef.get(BlogResolver);
  });

  it('protects read queries with JwtAuthGuard', () => {
    const blogsGuards = Reflect.getMetadata(GUARDS_METADATA, BlogResolver.prototype.blogs) as unknown[];
    const blogGuards = Reflect.getMetadata(GUARDS_METADATA, BlogResolver.prototype.blog) as unknown[];

    expect(blogsGuards).toContain(JwtAuthGuard);
    expect(blogGuards).toContain(JwtAuthGuard);
  });

  it('scopes blog list by current user id', async () => {
    blogService.getBlogs.mockResolvedValue([]);

    await blogResolver.blogs({ userId: 'user-123', email: 'dev@example.com' });

    expect(blogService.getBlogs).toHaveBeenCalledWith('user-123');
  });

  it('loads blog detail by id for authenticated user', async () => {
    blogService.getBlogById.mockResolvedValue(null);

    await blogResolver.blog('blog-1', { userId: 'user-abc', email: 'dev@example.com' });

    expect(blogService.getBlogById).toHaveBeenCalledWith('blog-1');
  });
});

