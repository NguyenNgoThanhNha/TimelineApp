import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTimelineDto } from '../dto/create-timeline.dto';
import { QueryTimelineDto } from '../dto/query-timeline.dto';
import { UpdateTimelineDto } from '../dto/update-timeline.dto';
import { TimelineService } from '../services/timeline.service';

@ApiTags('timelines')
@Controller('api/timelines')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  // GET /api/timelines?search=&status=&category=&from=&to=
  @Get()
  async findAll(@Query() query: QueryTimelineDto) {
    const data = await this.service.findAll(query);
    // Trả { data, totalRecord } để interceptor bọc kèm TotalRecord
    return { data, totalRecord: data.length };
  }

  // GET /api/timelines/categories  (khai báo TRƯỚC ':id' để không bị nuốt route)
  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  // GET /api/timelines/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // POST /api/timelines
  @Post()
  create(@Body() dto: CreateTimelineDto) {
    return this.service.create(dto);
  }

  // PUT /api/timelines/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimelineDto) {
    return this.service.update(id, dto);
  }

  // DELETE /api/timelines/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
