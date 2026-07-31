import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SearchService } from '../services/search.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  // GET /api/search?q=… — tìm nhanh trong bài viết, tài liệu và task
  @Get()
  search(@CurrentUser() user: CurrentUserPayload, @Query('q') q = '') {
    return this.service.searchAll(user, q);
  }
}
