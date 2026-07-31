import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePostDto } from '../dto/create-post.dto';
import { QueryPostDto } from '../dto/query-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostScheduleService } from '../services/post-schedule.service';
import { PostService } from '../services/post.service';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/posts')
export class PostController {
  constructor(
    private readonly service: PostService,
    private readonly schedule: PostScheduleService,
  ) {}

  // GET /api/posts?search=&category=&tag=&timelineId=&page=&pageSize=
  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryPostDto) {
    const result = await this.service.findAll(user, query);
    return { data: result, totalRecord: result.total };
  }

  // GET /api/posts/categories — cho trang Chuyên mục
  @Get('categories')
  getCategories(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getCategories(user);
  }

  // GET /api/posts/tags — cho trang Thẻ
  @Get('tags')
  getTags(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getTags(user);
  }

  // GET /api/posts/series — danh sách chuỗi bài kèm số kỳ
  @Get('series')
  getSeries(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getSeries(user);
  }

  // GET /api/posts/stats — thống kê ghi chép cho Dashboard
  @Get('stats')
  getWritingStats(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getWritingStats(user);
  }

  // GET /api/posts/scheduled — hàng đợi bài đã hẹn giờ, chưa tới hạn
  @Get('scheduled')
  async findScheduled(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.service.findScheduled(user);
    return { data, totalRecord: data.length };
  }

  // POST /api/posts/scheduled/run — chạy tay job đăng bài tới hạn (kiểm tra / bù khi server tắt lâu)
  @Post('scheduled/run')
  runSchedule() {
    return this.schedule.publishDuePosts();
  }

  // POST /api/posts/:id/publish — đăng ngay, bỏ lịch hẹn
  @Post(':id/publish')
  publishNow(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.publishNow(user, id);
  }

  // GET /api/posts/:slug — chi tiết theo slug (đẹp URL, giống blog thật)
  @Get(':slug')
  findBySlug(@CurrentUser() user: CurrentUserPayload, @Param('slug') slug: string) {
    return this.service.findBySlug(user, slug);
  }

  // POST /api/posts
  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreatePostDto) {
    return this.service.create(user, dto);
  }

  // PUT /api/posts/:id
  @Put(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.service.update(user, id, dto);
  }

  // DELETE /api/posts/:id
  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
