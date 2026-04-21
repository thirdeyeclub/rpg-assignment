import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { firstValueFrom, take } from 'rxjs';
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
      id: 'blog-1',
      subject: 's',
      content: 'c',
      authorId: 'user-1',
      createdAt: 123,
    };
    const nextEvent = firstValueFrom(notificationsService.streamBlogPublishedEvents().pipe(take(1)));
    notificationsService.emitBlogPublished(event);

    await expect(nextEvent).resolves.toEqual({
      type: 'blog-published',
      data: event,
    });
  });
});
