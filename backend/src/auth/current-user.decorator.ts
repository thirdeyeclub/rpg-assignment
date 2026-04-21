import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface AuthenticatedRequestUser {
  userId: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestUser => {
    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req.user as AuthenticatedRequestUser;
  },
);
