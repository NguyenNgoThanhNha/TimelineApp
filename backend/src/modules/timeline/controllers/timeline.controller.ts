import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateTimelineDto } from '../dto/create-timeline.dto';
import { QueryTimelineDto } from '../dto/query-timeline.dto';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { UpdateTimelineDto } from '../dto/update-timeline.dto';
import { TimelineService } from '../services/timeline.service';

@ApiTags('timelines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // mọi route đều yêu cầu đăng nhập
@Controller('api/timelines')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  // GET /api/timelines?search=&status=&category=&from=&to=
  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryTimelineDto) {
    const data = await this.service.findAll(user, query);
    return { data, totalRecord: data.length };
  }

  // GET /api/timelines/stats  (Dashboard) — khai báo trước ':id'
  @Get('stats')
  getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getStats(user);
  }

  // GET /api/timelines/categories
  @Get('categories')
  getCategories(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getCategories(user);
  }

  // GET /api/timelines/:id
  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  // POST /api/timelines
  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateTimelineDto) {
    return this.service.create(user, dto);
  }

  // PUT /api/timelines/:id
  @Put(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTimelineDto,
  ) {
    return this.service.update(user, id, dto);
  }

  // PATCH /api/timelines/:id/status  (đổi riêng trạng thái — dùng cho kéo-thả Kanban)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateStatus(user, id, dto.status);
  }

  // DELETE /api/timelines/:id
  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
