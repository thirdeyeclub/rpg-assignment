import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthPayloadModel } from './dto/auth-payload.model';
import { LoginInput } from './dto/login.input';
import { AuthService } from './auth.service';

@Resolver(() => AuthPayloadModel)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayloadModel)
  async login(@Args('input') input: LoginInput): Promise<AuthPayloadModel> {
    return this.authService.login(input.email, input.password);
  }
}
