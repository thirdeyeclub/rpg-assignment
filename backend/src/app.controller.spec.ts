import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { firstValueFrom, take, toArray } from 'rxjs';
import { AuthService } from './auth/auth.service';
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
    } as const;
    const nextEvent = firstValueFrom(notificationsService.streamBlogPublishedEvents().pipe(take(1)));
    notificationsService.emitBlogPublished(event);

    await expect(nextEvent).resolves.toEqual({
      type: 'blog-published',
      data: event,
    });
  });

  it('streams queued blog events in emission order', async () => {
    const notificationsService = new NotificationsService();
    const events = [
      { blogId: '00000000-0000-4000-8000-000000000001' },
      { blogId: '00000000-0000-4000-8000-000000000002' },
      { blogId: '00000000-0000-4000-8000-000000000003' },
      { blogId: '00000000-0000-4000-8000-000000000004' },
      { blogId: '00000000-0000-4000-8000-000000000005' },
      { blogId: '00000000-0000-4000-8000-000000000006' },
      { blogId: '00000000-0000-4000-8000-000000000007' },
      { blogId: '00000000-0000-4000-8000-000000000008' },
      { blogId: '00000000-0000-4000-8000-000000000009' },
      { blogId: '00000000-0000-4000-8000-000000000010' },
    ] as const;

    const streamedEventsPromise = firstValueFrom(
      notificationsService.streamBlogPublishedEvents().pipe(take(events.length), toArray()),
    );

    events.forEach((event) => notificationsService.emitBlogPublished(event));

    await expect(streamedEventsPromise).resolves.toEqual(
      events.map((event) => ({
        type: 'blog-published',
        data: event,
      })),
    );
  });
});
