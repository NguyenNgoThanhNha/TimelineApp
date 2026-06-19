import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateTimelineDto } from '../dto/create-timeline.dto';
import { QueryTimelineDto } from '../dto/query-timeline.dto';
import { UpdateTimelineDto } from '../dto/update-timeline.dto';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy danh sách có lọc: search (title/description), status, category, khoảng startDate. */
  async findAll(query: QueryTimelineDto) {
    const where: Prisma.TimelineWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.from || query.to) {
      where.startDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    return this.prisma.timeline.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.timeline.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy timeline');
    return item;
  }

  async create(dto: CreateTimelineDto) {
    this.ensureValidDateRange(dto.startDate, dto.endDate);
    return this.prisma.timeline.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status,
        category: dto.category.trim(),
      },
    });
  }

  async update(id: string, dto: UpdateTimelineDto) {
    const current = await this.findOne(id); // ném 404 nếu không tồn tại

    const start = dto.startDate ?? current.startDate.toISOString();
    const end = dto.endDate !== undefined ? dto.endDate : current.endDate?.toISOString();
    this.ensureValidDateRange(start, end ?? undefined);

    return this.prisma.timeline.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.category !== undefined && { category: dto.category.trim() }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.timeline.delete({ where: { id } });
    return { id };
  }

  /** Danh sách category đang có (cho dropdown filter ở frontend). */
  async getCategories() {
    const rows = await this.prisma.timeline.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  }

  private ensureValidDateRange(start: string, end?: string) {
    if (end && new Date(end) < new Date(start)) {
      throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }
  }
}
