import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ResourceType } from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { QueryDocDto } from '../dto/query-doc.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';

/** Link tài nguyên ngoài (docs chính chủ, video, repo…) đính kèm task và/hoặc bài blog. */
@Injectable()
export class ResourceService {
  constructor(private readonly prisma: PrismaService) {}

  private ownerScope(user: CurrentUserPayload): Prisma.ResourceWhereInput {
    return user.role === 'Admin' ? {} : { ownerId: user.userId };
  }

  async findAll(user: CurrentUserPayload, query: QueryDocDto) {
    const where: Prisma.ResourceWhereInput = { ...this.ownerScope(user) };
    if (query.timelineId) where.timelineId = query.timelineId;
    if (query.postId) where.postId = query.postId;
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

    return this.prisma.resource.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  async create(user: CurrentUserPayload, dto: CreateResourceDto) {
    await this.ensureLinksOwned(user, dto.timelineId, dto.postId);
    return this.prisma.resource.create({
      data: {
        title: dto.title.trim(),
        url: dto.url.trim(),
        type: dto.type ?? ResourceType.Article,
        note: dto.note?.trim() || null,
        timelineId: dto.timelineId ?? null,
        postId: dto.postId ?? null,
        ownerId: user.userId,
      },
    });
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdateResourceDto) {
    await this.getOwnedOrThrow(user, id);
    await this.ensureLinksOwned(user, dto.timelineId, dto.postId);

    return this.prisma.resource.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.url !== undefined && { url: dto.url.trim() }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.note !== undefined && { note: dto.note?.trim() || null }),
        ...(dto.timelineId !== undefined && { timelineId: dto.timelineId || null }),
        ...(dto.postId !== undefined && { postId: dto.postId || null }),
      },
    });
  }

  async remove(user: CurrentUserPayload, id: string) {
    await this.getOwnedOrThrow(user, id);
    await this.prisma.resource.delete({ where: { id } });
    return { id };
  }

  // ----- helpers -----

  private async getOwnedOrThrow(user: CurrentUserPayload, id: string) {
    const item = await this.prisma.resource.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Không tìm thấy tài nguyên');
    if (item.ownerId !== user.userId && user.role !== 'Admin') {
      throw new ForbiddenException('Tài nguyên này không thuộc về bạn');
    }
    return item;
  }

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
}
