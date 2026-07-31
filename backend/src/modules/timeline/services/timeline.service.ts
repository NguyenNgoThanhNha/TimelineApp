import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TimelineStatus } from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateTimelineDto } from '../dto/create-timeline.dto';
import { QueryTimelineDto } from '../dto/query-timeline.dto';
import { UpdateTimelineDto } from '../dto/update-timeline.dto';

const STATUS_KEYS = ['Planned', 'InProgress', 'Completed', 'OnHold', 'Cancelled'] as const;

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mỗi user chỉ thấy timeline của mình; Admin thấy tất cả. */
  private ownerScope(user: CurrentUserPayload): Prisma.TimelineWhereInput {
    return user.role === 'Admin' ? {} : { userId: user.userId };
  }

  async findAll(user: CurrentUserPayload, query: QueryTimelineDto) {
    const where: Prisma.TimelineWhereInput = { ...this.ownerScope(user) };

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

    return this.prisma.timeline.findMany({ where, orderBy: { startDate: 'asc' } });
  }

  /**
   * Chi tiết task kèm "học gì" — bài blog đã gắn, trang tài liệu nội bộ và link ngoài.
   * Đây là dữ liệu cho trang chi tiết task (learning hub) ở frontend.
   */
  async findOne(user: CurrentUserPayload, id: string) {
    const timeline = await this.getOwnedOrThrow(user, id);

    const [posts, docs, resources] = await Promise.all([
      this.prisma.post.findMany({
        where: { timelineIds: { has: id } },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          category: true,
          tags: true,
          coverImage: true,
          readMinutes: true,
          views: true,
          publishedAt: true,
          published: true,
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.doc.findMany({
        where: { timelineId: id },
        select: { id: true, slug: true, title: true, summary: true, order: true, updatedAt: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.resource.findMany({ where: { timelineId: id }, orderBy: { createdAt: 'asc' } }),
    ]);

    return { ...timeline, posts, docs, resources };
  }

  async create(user: CurrentUserPayload, dto: CreateTimelineDto) {
    this.ensureValidDateRange(dto.startDate, dto.endDate);
    return this.prisma.timeline.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status,
        category: dto.category.trim(),
        objectives: this.cleanObjectives(dto.objectives),
        userId: user.userId, // gán chủ sở hữu = người đang đăng nhập
      },
    });
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdateTimelineDto) {
    const current = await this.getOwnedOrThrow(user, id);

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
        ...(dto.objectives !== undefined && { objectives: this.cleanObjectives(dto.objectives) }),
      },
    });
  }

  async remove(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    // MongoDB không cascade: gỡ liên kết blog và xoá tài liệu/link đính kèm task
    await this.prisma.timeline.update({ where: { id }, data: { posts: { set: [] } } });
    await this.prisma.doc.deleteMany({ where: { timelineId: id, postId: null } });
    await this.prisma.doc.updateMany({ where: { timelineId: id }, data: { timelineId: null } });
    await this.prisma.resource.deleteMany({ where: { timelineId: id, postId: null } });
    await this.prisma.resource.updateMany({ where: { timelineId: id }, data: { timelineId: null } });
    await this.prisma.timeline.delete({ where: { id } });
    return { id };
  }

  /** Cập nhật riêng trạng thái (dùng cho kéo-thả Kanban). */
  async updateStatus(user: CurrentUserPayload, id: string, status: TimelineStatus) {
    await this.getOwnedOrThrow(user, id);
    return this.prisma.timeline.update({ where: { id }, data: { status } });
  }

  async getCategories(user: CurrentUserPayload) {
    const rows = await this.prisma.timeline.findMany({
      where: this.ownerScope(user),
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  }

  /** Thống kê cho Dashboard (theo phạm vi của user / toàn bộ nếu Admin). */
  async getStats(user: CurrentUserPayload) {
    const items = await this.prisma.timeline.findMany({
      where: this.ownerScope(user),
      select: { status: true, category: true, startDate: true, endDate: true },
    });

    const byStatus: Record<string, number> = {};
    for (const k of STATUS_KEYS) byStatus[k] = 0;
    const byCategory: Record<string, number> = {};

    const now = new Date();
    let completed = 0;
    let upcoming = 0;
    let overdue = 0;

    for (const t of items) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;

      const active = t.status !== 'Completed' && t.status !== 'Cancelled';
      if (t.status === 'Completed') completed++;
      if (active && t.startDate > now) upcoming++;
      if (active && t.endDate && t.endDate < now) overdue++;
    }

    const total = items.length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, upcoming, overdue, completionRate, byStatus, byCategory };
  }

  // ----- helpers -----

  private async getOwnedOrThrow(user: CurrentUserPayload, id: string) {
    const item = await this.prisma.timeline.findUnique({ where: { id } });
    // Không lộ sự tồn tại của timeline người khác -> trả 404 thay vì 403
    if (!item || (user.role !== 'Admin' && item.userId !== user.userId)) {
      throw new NotFoundException('Không tìm thấy timeline');
    }
    return item;
  }

  /** Bỏ dòng trống, cắt khoảng trắng thừa trong danh sách mục tiêu học tập. */
  private cleanObjectives(objectives?: string[]): string[] {
    return (objectives ?? []).map((o) => o.trim()).filter(Boolean);
  }

  private ensureValidDateRange(start: string, end?: string) {
    if (end && new Date(end) < new Date(start)) {
      throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }
  }
}
