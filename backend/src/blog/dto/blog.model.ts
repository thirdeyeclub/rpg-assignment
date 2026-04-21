import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BlogModel {
  @Field()
  id: string;

  @Field()
  subject: string;

  @Field()
  content: string;

  @Field()
  authorId: string;

  @Field(() => String)
  authorEmail?: string;

  @Field(() => Int)
  createdAt: number;
}
