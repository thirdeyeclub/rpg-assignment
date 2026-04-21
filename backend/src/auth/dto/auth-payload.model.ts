import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../user/dto/user.model';

@ObjectType()
export class AuthPayloadModel {
  @Field()
  accessToken: string;

  @Field(() => UserModel)
  user: UserModel;
}
