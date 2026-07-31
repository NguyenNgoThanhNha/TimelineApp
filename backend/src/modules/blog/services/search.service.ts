import { Injectable } from '@nestjs/common';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

const LIMIT_PER_GROUP = 5;

/**
 * Tìm kiếm nhanh trên toàn bộ nội dung: bài viết, trang tài liệu và task.
 * Phục vụ hộp tìm kiếm Ctrl+K ở frontend nên chỉ trả vài kết quả mỗi nhóm.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAll(user: CurrentUserPayload, term: string) {
    const query = term.trim();
    if (query.length < 2) return { posts: [], docs: [], timelines: [] };

    const isAdmin = user.role === 'Admin';
    const contains = { contains: query, mode: 'insensitive' as const };

    const [posts, docs, timelines] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          AND: [
            isAdmin ? {} : { OR: [{ published: true }, { authorId: user.userId }] },
            { OR: [{ title: contains }, { summary: contains }, { content: contains }] },
          ],
        },
        select: { id: true, slug: true, title: true, category: true, summary: true, series: true },
        orderBy: { publishedAt: 'desc' },
        take: LIMIT_PER_GROUP,
      }),
      this.prisma.doc.findMany({
        where: {
          AND: [
            isAdmin ? {} : { ownerId: user.userId },
            { OR: [{ title: contains }, { summary: contains }, { content: contains }] },
          ],
        },
        select: { id: true, slug: true, title: true, summary: true },
        orderBy: { updatedAt: 'desc' },
        take: LIMIT_PER_GROUP,
      }),
      this.prisma.timeline.findMany({
        where: {
          AND: [
            isAdmin ? {} : { userId: user.userId },
            { OR: [{ title: contains }, { description: contains }] },
          ],
        },
        select: { id: true, title: true, category: true, status: true },
        orderBy: { startDate: 'asc' },
        take: LIMIT_PER_GROUP,
      }),
    ]);

    return { posts, docs, timelines };
  }
}
