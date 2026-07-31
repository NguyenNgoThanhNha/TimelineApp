import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { slugify } from '../../../common/slug.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateDocDto } from '../dto/create-doc.dto';
import { QueryDocDto } from '../dto/query-doc.dto';
import { UpdateDocDto } from '../dto/update-doc.dto';

const DOC_DETAIL_INCLUDE = {
  owner: { select: { id: true, name: true } },
  timeline: { select: { id: true, title: true, status: true, category: true } },
  post: { select: { id: true, slug: true, title: true, category: true } },
} satisfies Prisma.DocInclude;

/**
 * Trang tài liệu nội bộ — mỗi Doc là một trang Markdown đầy đủ (mục lục, code block)
 * đính kèm vào task và/hoặc bài blog.
 */
@Injectable()
export class DocService {
  constructor(private readonly prisma: PrismaService) {}

  private ownerScope(user: CurrentUserPayload): Prisma.DocWhereInput {
    return user.role === 'Admin' ? {} : { ownerId: user.userId };
  }

  async findAll(user: CurrentUserPayload, query: QueryDocDto) {
    const where: Prisma.DocWhereInput = { ...this.ownerScope(user) };
    if (query.timelineId) where.timelineId = query.timelineId;
    if (query.postId) where.postId = query.postId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.doc.findMany({
      where,
      include: DOC_DETAIL_INCLUDE,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findBySlug(user: CurrentUserPayload, slug: string) {
    const doc = await this.prisma.doc.findUnique({ where: { slug }, include: DOC_DETAIL_INCLUDE });
    if (!doc || (doc.ownerId !== user.userId && user.role !== 'Admin')) {
      throw new NotFoundException('Không tìm thấy tài liệu');
    }

    // Điều hướng trước/sau trong cùng một task để đọc liền mạch
    const siblings = doc.timelineId
      ? await this.prisma.doc.findMany({
          where: { timelineId: doc.timelineId, ...this.ownerScope(user) },
          select: { id: true, slug: true, title: true },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        })
      : [];
    const index = siblings.findIndex((d) => d.id === doc.id);

    return {
      ...doc,
      siblings,
      prev: index > 0 ? siblings[index - 1] : null,
      next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null,
    };
  }

  async create(user: CurrentUserPayload, dto: CreateDocDto) {
    await this.ensureLinksOwned(user, dto.timelineId, dto.postId);
    const slug = await this.uniqueSlug(dto.slug || dto.title);

    return this.prisma.doc.create({
      data: {
        slug,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        content: dto.content,
        order: dto.order ?? (await this.nextOrder(dto.timelineId)),
        timelineId: dto.timelineId ?? null,
        postId: dto.postId ?? null,
        ownerId: user.userId,
      },
      include: DOC_DETAIL_INCLUDE,
    });
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdateDocDto) {
    const current = await this.getOwnedOrThrow(user, id);
    await this.ensureLinksOwned(user, dto.timelineId, dto.postId);

    const data: Prisma.DocUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.summary !== undefined && { summary: dto.summary?.trim() || null }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.order !== undefined && { order: dto.order }),
    };

    if (dto.slug !== undefined && slugify(dto.slug) !== current.slug) {
      data.slug = await this.uniqueSlug(dto.slug);
    }
    if (dto.timelineId !== undefined) {
      data.timeline = dto.timelineId ? { connect: { id: dto.timelineId } } : { disconnect: true };
    }
    if (dto.postId !== undefined) {
      data.post = dto.postId ? { connect: { id: dto.postId } } : { disconnect: true };
    }

    return this.prisma.doc.update({ where: { id }, data, include: DOC_DETAIL_INCLUDE });
  }

  async remove(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    await this.prisma.doc.delete({ where: { id } });
    return { id };
  }

  // ----- helpers -----

  private async getOwnedOrThrow(user: CurrentUserPayload, id: string) {
    const doc = await this.prisma.doc.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Không tìm thấy tài liệu');
    if (doc.ownerId !== user.userId && user.role !== 'Admin') {
      throw new ForbiddenException('Tài liệu này không thuộc về bạn');
    }
    return doc;
  }

  /** Không cho đính tài liệu vào task/bài viết của người khác. */
  private async ensureLinksOwned(user: CurrentUserPayload, timelineId?: string, postId?: string) {
    if (timelineId) {
      const timeline = await this.prisma.timeline.findUnique({ where: { id: timelineId } });
      if (!timeline || (timeline.userId !== user.userId && user.role !== 'Admin')) {
        throw new NotFoundException('Không tìm thấy task để đính kèm');
      }
    }
    if (postId) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post || (post.authorId !== user.userId && user.role !== 'Admin')) {
        throw new NotFoundException('Không tìm thấy bài viết để đính kèm');
      }
    }
  }

  private async nextOrder(timelineId?: string): Promise<number> {
    if (!timelineId) return 0;
    const last = await this.prisma.doc.findFirst({
      where: { timelineId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  private async uniqueSlug(source: string): Promise<string> {
    const base = slugify(source) || 'tai-lieu';
    let candidate = base;
    for (let i = 2; await this.prisma.doc.findUnique({ where: { slug: candidate } }); i++) {
      candidate = `${base}-${i}`;
    }
    return candidate;
  }
}
