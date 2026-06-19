import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, TimelineStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Seed dữ liệu mẫu lấy từ lộ trình trong D:\Roadmap (chỉ chạy 1 lần khi collection rỗng).
 * Giúp mở app lên là thấy ngay timeline trực quan.
 */
@Injectable()
export class TimelineSeederService implements OnModuleInit {
  private readonly logger = new Logger(TimelineSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Retry phòng khi replica set chưa bầu xong primary lúc khởi động
    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const count = await this.prisma.timeline.count();
        if (count > 0) {
          this.logger.log(`Đã có ${count} timeline, bỏ qua seed.`);
          return;
        }
        await this.prisma.timeline.createMany({ data: this.seedData() });
        this.logger.log('Đã seed dữ liệu timeline từ lộ trình.');
        return;
      } catch (err) {
        this.logger.warn(
          `Seed chưa được (lần ${attempt}/${maxAttempts}): ${(err as Error).message}`,
        );
        if (attempt === maxAttempts) {
          this.logger.error('Bỏ qua seed sau nhiều lần thử.');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  private seedData(): Prisma.TimelineCreateManyInput[] {
    const make = (
      title: string,
      description: string | null,
      startDate: string,
      endDate: string | null,
      status: TimelineStatus,
      category: string,
    ): Prisma.TimelineCreateManyInput => ({
      title,
      description: description ?? undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      category,
    });

    return [
      make('Củng cố C# & .NET nền tảng', 'async/await, IQueryable vs IEnumerable, record, pattern matching.', '2026-06-18', '2026-07-01', TimelineStatus.InProgress, 'Tech'),
      make('TypeScript chuyên sâu', 'strict, generics, discriminated union, Zod.', '2026-07-01', '2026-07-14', TimelineStatus.Planned, 'Tech'),
      make('EF Core hiệu năng', 'N+1, projection, AsNoTracking, optimistic concurrency.', '2026-07-15', '2026-07-28', TimelineStatus.Planned, 'Tech'),
      make('Clean Architecture + CQRS', 'Tách layer, MediatR, FluentValidation.', '2026-08-01', '2026-08-20', TimelineStatus.Planned, 'Tech'),

      make('NeetCode: Arrays & Hashing', 'Contains Duplicate, Two Sum, Group Anagrams, Top-K...', '2026-06-18', '2026-07-02', TimelineStatus.InProgress, 'Thuật toán'),
      make('NeetCode: Two Pointers & Sliding Window', '3Sum, Container With Most Water, Longest Substring...', '2026-07-03', '2026-07-20', TimelineStatus.Planned, 'Thuật toán'),
      make('NeetCode: Trees & Graphs', 'DFS/BFS, Level Order, Number of Islands, Course Schedule.', '2026-08-15', '2026-09-30', TimelineStatus.Planned, 'Thuật toán'),

      make('Dự án 1 — Ticketing System', 'Clean Architecture + CQRS + Auth + Testing, deploy live.', '2026-07-20', '2026-09-15', TimelineStatus.Planned, 'Dự án'),
      make('Dự án 2 — Quản lý kho', 'Optimistic concurrency, transaction, báo cáo.', '2026-09-16', '2026-11-20', TimelineStatus.Planned, 'Dự án'),
      make('Dự án 3 — Order/Delivery event-driven', 'Message queue, saga, SignalR, resilience.', '2026-11-21', '2027-02-01', TimelineStatus.Planned, 'Dự án'),

      make('IELTS Giai đoạn 1 — Xây nền', 'Ngữ pháp (Murphy) + từ vựng (Anki) + input.', '2026-06-18', '2026-09-18', TimelineStatus.InProgress, 'IELTS'),
      make('IELTS Giai đoạn 2 — Kỹ năng', 'Kỹ thuật từng dạng + gia sư Writing/Speaking.', '2026-09-19', '2026-12-18', TimelineStatus.Planned, 'IELTS'),
      make('IELTS Giai đoạn 3 — Luyện đề', 'Full mock test mỗi 1–2 tuần, tăng tốc lên 6.5.', '2026-12-19', '2027-03-15', TimelineStatus.Planned, 'IELTS'),
      make('Thi IELTS Academic (mục tiêu 6.5)', 'Đăng ký thi khi mock đạt 6.5 hai lần liên tiếp.', '2027-03-20', null, TimelineStatus.Planned, 'IELTS'),

      make('🎯 Đạt Mid-level Developer', 'Kết hợp kỹ thuật vững + đưa sản phẩm ra production.', '2027-06-01', null, TimelineStatus.Planned, 'Mục tiêu'),
    ];
  }
}
