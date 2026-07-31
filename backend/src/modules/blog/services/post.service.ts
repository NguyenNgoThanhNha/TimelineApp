import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { estimateReadMinutes, slugify } from '../../../common/slug.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { QueryPostDto } from '../dto/query-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

// Thông tin tác giả + task hiển thị kèm bài viết (không trả password, không trả cả cây)
const POST_LIST_INCLUDE = {
  author: { select: { id: true, name: true } },
  timelines: { select: { id: true, title: true, status: true, category: true } },
  _count: { select: { docs: true, resources: true } },
} satisfies Prisma.PostInclude;

const POST_DETAIL_INCLUDE = {
  author: { select: { id: true, name: true } },
  timelines: {
    select: { id: true, title: true, status: true, category: true, startDate: true, endDate: true },
  },
  docs: {
    select: { id: true, slug: true, title: true, summary: true, order: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  },
  resources: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.PostInclude;

const DEFAULT_PAGE_SIZE = 9;

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ai đọc được bài nào: bài đã publish thì mọi người đọc được,
   * bản nháp thì chỉ tác giả (và Admin) thấy.
   */
  private readScope(user: CurrentUserPayload): Prisma.PostWhereInput {
    if (user.role === 'Admin') return {};
    return { OR: [{ published: true }, { authorId: user.userId }] };
  }

  async findAll(user: CurrentUserPayload, query: QueryPostDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const filters: Prisma.PostWhereInput[] = [this.readScope(user)];

    if (query.search) {
      filters.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { summary: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.category) {
      // Cho phép truyền cả tên ("Backend") lẫn slug ("backend")
      const all = await this.prisma.post.findMany({ select: { category: true }, distinct: ['category'] });
      const matched = all.map((r) => r.category).filter((c) => slugify(c) === slugify(query.category!));
      filters.push({ category: { in: matched.length ? matched : [query.category] } });
    }
    if (query.tag) filters.push({ tags: { has: query.tag } });
    if (query.timelineId) filters.push({ timelineIds: { has: query.timelineId } });

    const where: Prisma.PostWhereInput = { AND: filters };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_LIST_INCLUDE,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((p) => this.stripContent(p)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Chi tiết bài viết theo slug — kèm task liên quan, tài liệu, link ngoài và bài liên quan. */
  async findBySlug(user: CurrentUserPayload, slug: string) {
    const post = await this.prisma.post.findUnique({ where: { slug }, include: POST_DETAIL_INCLUDE });
    if (!post || (!post.published && post.authorId !== user.userId && user.role !== 'Admin')) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Đếm lượt xem (không chặn response nếu ghi lỗi)
    const views = post.views + 1;
    await this.prisma.post.update({ where: { id: post.id }, data: { views } }).catch(() => undefined);

    const related = await this.findRelated(user, post);
    return { ...post, views, related };
  }

  /** Bài liên quan: ưu tiên cùng chuyên mục hoặc trùng thẻ. */
  private async findRelated(user: CurrentUserPayload, post: { id: string; category: string; tags: string[] }) {
    const items = await this.prisma.post.findMany({
      where: {
        AND: [
          this.readScope(user),
          { id: { not: post.id } },
          { OR: [{ category: post.category }, { tags: { hasSome: post.tags } }] },
        ],
      },
      include: POST_LIST_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return items.map((p) => this.stripContent(p));
  }

  async create(user: CurrentUserPayload, dto: CreatePostDto) {
    const slug = await this.uniqueSlug(dto.slug || dto.title);
    return this.prisma.post.create({
      data: {
        slug,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        content: dto.content,
        coverImage: dto.coverImage?.trim() || null,
        category: dto.category.trim(),
        tags: this.normalizeTags(dto.tags),
        published: dto.published ?? true,
        readMinutes: estimateReadMinutes(dto.content),
        authorId: user.userId,
        ...(dto.timelineIds?.length && {
          timelines: { connect: dto.timelineIds.map((id) => ({ id })) },
        }),
      },
      include: POST_LIST_INCLUDE,
    });
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdatePostDto) {
    const current = await this.getEditableOrThrow(user, id);

    const data: Prisma.PostUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.summary !== undefined && { summary: dto.summary?.trim() || null }),
      ...(dto.content !== undefined && {
        content: dto.content,
        readMinutes: estimateReadMinutes(dto.content),
      }),
      ...(dto.coverImage !== undefined && { coverImage: dto.coverImage?.trim() || null }),
      ...(dto.category !== undefined && { category: dto.category.trim() }),
      ...(dto.tags !== undefined && { tags: this.normalizeTags(dto.tags) }),
      ...(dto.published !== undefined && { published: dto.published }),
    };

    if (dto.slug !== undefined && slugify(dto.slug) !== current.slug) {
      data.slug = await this.uniqueSlug(dto.slug);
    }

    // Gắn/bỏ task: gửi mảng mới là thay thế toàn bộ liên kết hiện tại
    if (dto.timelineIds !== undefined) {
      data.timelines = { set: dto.timelineIds.map((tid) => ({ id: tid })) };
    }

    return this.prisma.post.update({ where: { id }, data, include: POST_LIST_INCLUDE });
  }

  async remove(user: CurrentUserPayload, id: string) {
    await this.getEditableOrThrow(user, id);
    // MongoDB không cascade: phải tự gỡ mọi tham chiếu trước khi xoá bài
    await this.prisma.post.update({ where: { id }, data: { timelines: { set: [] } } });
    await this.prisma.doc.updateMany({ where: { postId: id }, data: { postId: null } });
    // Link ngoài chỉ thuộc riêng bài viết thì xoá luôn, link dùng chung với task thì chỉ gỡ
    await this.prisma.resource.deleteMany({ where: { postId: id, timelineId: null } });
    await this.prisma.resource.updateMany({ where: { postId: id }, data: { postId: null } });
    await this.prisma.post.delete({ where: { id } });
    return { id };
  }

  /** Danh sách chuyên mục kèm số bài — dùng cho trang Chuyên mục và bộ lọc. */
  async getCategories(user: CurrentUserPayload) {
    const rows = await this.prisma.post.groupBy({
      by: ['category'],
      where: this.readScope(user),
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ name: r.category, slug: slugify(r.category), count: r._count._all }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /** Danh sách thẻ kèm số bài (tags là mảng nên gom trong bộ nhớ). */
  async getTags(user: CurrentUserPayload) {
    const rows = await this.prisma.post.findMany({
      where: this.readScope(user),
      select: { tags: true },
    });
    const counter = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags) counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  // ----- helpers -----

  /** Bỏ `content` khỏi payload danh sách cho nhẹ (card chỉ cần summary). */
  private stripContent<T extends { content: string }>(post: T): Omit<T, 'content'> {
    const { content: _content, ...rest } = post;
    return rest;
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags) return [];
    const cleaned = tags.map((t) => slugify(t)).filter(Boolean);
    return [...new Set(cleaned)];
  }

  private async getEditableOrThrow(user: CurrentUserPayload, id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    if (post.authorId !== user.userId && user.role !== 'Admin') {
      throw new ForbiddenException('Bạn không phải tác giả của bài viết này');
    }
    return post;
  }

  /** Slug phải là duy nhất — trùng thì thêm hậu tố -2, -3… */
  private async uniqueSlug(source: string): Promise<string> {
    const base = slugify(source) || 'bai-viet';
    let candidate = base;
    for (let i = 2; await this.prisma.post.findUnique({ where: { slug: candidate } }); i++) {
      candidate = `${base}-${i}`;
    }
    return candidate;
  }
}
