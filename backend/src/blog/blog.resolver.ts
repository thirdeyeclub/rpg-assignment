import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, type AuthenticatedRequestUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBlogInput } from './dto/create-blog.input';
import { BlogModel } from './dto/blog.model';
import { BlogService } from './blog.service';

@Resolver(() => BlogModel)
export class BlogResolver {
  constructor(private readonly blogService: BlogService) {}

  @Query(() => [BlogModel])
  async blogs(): Promise<BlogModel[]> {
    return this.blogService.getBlogs();
  }

  @Query(() => BlogModel, { nullable: true })
  async blog(@Args('id') id: string): Promise<BlogModel | null> {
    return this.blogService.getBlogById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => BlogModel)
  async createBlog(
    @Args('input') input: CreateBlogInput,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<BlogModel> {
    return this.blogService.createBlog(input.subject, input.content, user.userId);
  }
}
