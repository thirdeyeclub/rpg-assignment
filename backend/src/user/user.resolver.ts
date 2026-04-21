import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RegisterInput } from './dto/register.input';
import { UserModel } from './dto/user.model';
import { UserService } from './user.service';

@Resolver(() => UserModel)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserModel)
  async register(@Args('input') input: RegisterInput): Promise<UserModel> {
    return this.userService.register(input.email, input.password);
  }
}
