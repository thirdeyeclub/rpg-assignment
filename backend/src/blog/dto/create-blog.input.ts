import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateBlogInput {
  @Field()
  subject: string;

  @Field()
  content: string;
}
