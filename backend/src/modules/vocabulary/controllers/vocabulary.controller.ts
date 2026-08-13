import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BulkCreateVocabularyDto } from '../dto/bulk-create-vocabulary.dto';
import { CreateVocabularyDto } from '../dto/create-vocabulary.dto';
import { QueryVocabularyDto } from '../dto/query-vocabulary.dto';
import { ReviewVocabularyDto } from '../dto/review-vocabulary.dto';
import { UpdateVocabularyDto } from '../dto/update-vocabulary.dto';
import { VocabularyService } from '../services/vocabulary.service';

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // từ vựng là dữ liệu cá nhân — mọi route đều yêu cầu đăng nhập
@Controller('api/vocabulary')
export class VocabularyController {
  constructor(private readonly service: VocabularyService) {}

  // GET /api/vocabulary?search=&partOfSpeech=&cefrLevel=&learningStatus=&date=&sort=&page=&pageSize=
  @Get()
  @ApiOperation({ summary: 'Danh sách từ vựng (tìm kiếm, lọc, sắp xếp, phân trang)' })
  findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryVocabularyDto) {
    return this.service.findAll(user, query);
  }

  // ----- route tĩnh phải khai báo trước ':id' -----

  // GET /api/vocabulary/daily?date=2026-08-13
  @Get('daily')
  @ApiOperation({ summary: 'Từ đã học trong một ngày' })
  @ApiQuery({ name: 'date', required: false, example: '2026-08-13' })
  daily(@CurrentUser() user: CurrentUserPayload, @Query('date') date?: string) {
    return this.service.daily(user, date);
  }

  // GET /api/vocabulary/history
  @Get('history')
  @ApiOperation({ summary: 'Lịch sử học theo ngày (30 ngày gần nhất)' })
  history(@CurrentUser() user: CurrentUserPayload) {
    return this.service.history(user);
  }

  // GET /api/vocabulary/statistics
  @Get('statistics')
  @ApiOperation({ summary: 'Thống kê dashboard + learning streak' })
  statistics(@CurrentUser() user: CurrentUserPayload) {
    return this.service.statistics(user);
  }

  // GET /api/vocabulary/lookup?word=accomplish
  @Get('lookup')
  @ApiOperation({ summary: 'Kiểm tra một từ đã có trong bộ từ của mình chưa (dùng khi click synonym)' })
  lookup(@CurrentUser() user: CurrentUserPayload, @Query('word') word: string) {
    return this.service.lookup(user, word);
  }

  // GET /api/vocabulary/review/today
  @Get('review/today')
  @ApiOperation({ summary: 'Hàng đợi từ cần ôn hôm nay' })
  reviewToday(@CurrentUser() user: CurrentUserPayload) {
    return this.service.reviewToday(user);
  }

  // POST /api/vocabulary/bulk
  @Post('bulk')
  @ApiOperation({ summary: 'Thêm nhiều từ cùng lúc — từ đã tồn tại sẽ được báo lại, không tạo trùng' })
  bulkCreate(@CurrentUser() user: CurrentUserPayload, @Body() dto: BulkCreateVocabularyDto) {
    return this.service.bulkCreate(user, dto);
  }

  // POST /api/vocabulary
  @Post()
  @ApiOperation({ summary: 'Thêm một từ (enrich chạy nền, không chặn response)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateVocabularyDto) {
    return this.service.create(user, dto);
  }

  // ----- route theo id -----

  // GET /api/vocabulary/:id
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết từ vựng (đọc từ database, không gọi API ngoài)' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  // PATCH /api/vocabulary/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ghi chú / trạng thái học / CEFR' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVocabularyDto,
  ) {
    return this.service.update(user, id, dto);
  }

  // POST /api/vocabulary/:id/refresh
  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh dictionary data — nơi duy nhất gọi lại API bên ngoài' })
  refresh(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.refresh(user, id);
  }

  // GET /api/vocabulary/:id/reviews
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Lịch sử ôn tập của một từ (20 lượt gần nhất)' })
  reviewHistory(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.reviewHistory(user, id);
  }

  // POST /api/vocabulary/:id/review
  @Post(':id/review')
  @ApiOperation({ summary: 'Lưu kết quả ôn tập và tính lịch ôn kế tiếp (SM-2)' })
  review(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ReviewVocabularyDto,
  ) {
    return this.service.review(user, id, dto);
  }

  // POST /api/vocabulary/:id/mark-reviewed
  @Post(':id/mark-reviewed')
  @ApiOperation({ summary: 'Đánh dấu đã ôn lại hôm nay (khi nhập lại một từ đã học)' })
  markReviewed(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.markReviewedToday(user, id);
  }

  // DELETE /api/vocabulary/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá từ vựng cùng toàn bộ dữ liệu liên quan' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
