import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser, type AuthenticatedRequestUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { CreateBlogInput } from './dto/create-blog.input';
import { BlogModel } from './dto/blog.model';
import { BlogService } from './blog.service';

@Resolver(() => BlogModel)
export class BlogResolver {
  constructor(
    private readonly blogService: BlogService,
    private readonly userService: UserService,
  ) {}

  @ResolveField(() => String)
  async authorEmail(@Parent() blog: BlogModel): Promise<string> {
    const user = await this.userService.findById(blog.authorId);
    return user?.email ?? '';
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [BlogModel])
  async blogs(@CurrentUser() user: AuthenticatedRequestUser): Promise<BlogModel[]> {
    return this.blogService.getBlogs(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => BlogModel, { nullable: true })
  async blog(@Args('id') id: string, @CurrentUser() user: AuthenticatedRequestUser): Promise<BlogModel | null> {
    return this.blogService.getBlogById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => BlogModel)
  async createBlog(
    @Args('input') input: CreateBlogInput,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<BlogModel> {
    return this.blogService.createBlog(input.subject, input.content, user.userId, user.email);
  }
}
