import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateDocDto } from '../dto/create-doc.dto';
import { QueryDocDto } from '../dto/query-doc.dto';
import { UpdateDocDto } from '../dto/update-doc.dto';
import { DocService } from '../services/doc.service';

@ApiTags('docs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/docs')
export class DocController {
  constructor(private readonly service: DocService) {}

  // GET /api/docs?timelineId=&postId=&search=
  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryDocDto) {
    const data = await this.service.findAll(user, query);
    return { data, totalRecord: data.length };
  }

  // GET /api/docs/:slug
  @Get(':slug')
  findBySlug(@CurrentUser() user: CurrentUserPayload, @Param('slug') slug: string) {
    return this.service.findBySlug(user, slug);
  }

  // POST /api/docs
  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateDocDto) {
    return this.service.create(user, dto);
  }

  // PUT /api/docs/:id
  @Put(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocDto,
  ) {
    return this.service.update(user, id, dto);
  }

  // DELETE /api/docs/:id
  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
