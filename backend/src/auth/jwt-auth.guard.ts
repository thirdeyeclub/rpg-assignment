import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    if (context.getType<string>() === 'http') {
      return context.switchToHttp().getRequest<Request>();
    }

    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req as Request;
  }
}
