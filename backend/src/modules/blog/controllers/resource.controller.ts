import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { QueryDocDto } from '../dto/query-doc.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { ResourceService } from '../services/resource.service';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/resources')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  // GET /api/resources?timelineId=&postId=
  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryDocDto) {
    const data = await this.service.findAll(user, query);
    return { data, totalRecord: data.length };
  }

  // POST /api/resources
  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateResourceDto) {
    return this.service.create(user, dto);
  }

  // PUT /api/resources/:id
  @Put(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.service.update(user, id, dto);
  }

  // DELETE /api/resources/:id
  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
