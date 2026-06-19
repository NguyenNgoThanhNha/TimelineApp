import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, Role, TimelineStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Seed lần đầu (khi chưa có user nào): tạo 2 tài khoản demo + dữ liệu timeline mẫu.
 *  - admin@timeline.local / Admin@123  (Admin — xem tất cả)
 *  - user@timeline.local  / User@123   (User  — chỉ xem của mình)
 */
@Injectable()
export class TimelineSeederService implements OnModuleInit {
  private readonly logger = new Logger(TimelineSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const userCount = await this.prisma.user.count();
        if (userCount > 0) {
          this.logger.log(`Đã có ${userCount} user, bỏ qua seed.`);
          return;
        }

        const [adminPwd, userPwd] = await Promise.all([
          bcrypt.hash('Admin@123', 10),
          bcrypt.hash('User@123', 10),
        ]);

        const admin = await this.prisma.user.create({
          data: { email: 'admin@timeline.local', name: 'Quản trị viên', password: adminPwd, role: Role.Admin },
        });
        const demo = await this.prisma.user.create({
          data: { email: 'user@timeline.local', name: 'Người dùng demo', password: userPwd, role: Role.User },
        });

        // Dọn timeline cũ (nếu có bản chưa có chủ sở hữu từ lần chạy trước) rồi seed lại
        await this.prisma.timeline.deleteMany({});
        await this.prisma.timeline.createMany({ data: this.seedData(demo.id, admin.id) });

        this.logger.log('Đã seed 2 tài khoản demo + dữ liệu timeline.');
        return;
      } catch (err) {
        this.logger.warn(`Seed chưa được (lần ${attempt}/${maxAttempts}): ${(err as Error).message}`);
        if (attempt === maxAttempts) {
          this.logger.error('Bỏ qua seed sau nhiều lần thử.');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  private seedData(demoId: string, adminId: string): Prisma.TimelineCreateManyInput[] {
    const make = (
      userId: string,
      title: string,
      description: string | null,
      startDate: string,
      endDate: string | null,
      status: TimelineStatus,
      category: string,
    ): Prisma.TimelineCreateManyInput => ({
      userId,
      title,
      description: description ?? undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      category,
    });

    return [
      // ----- Của người dùng demo (user@timeline.local) -----
      make(demoId, 'Củng cố C# & .NET nền tảng', 'async/await, IQueryable vs IEnumerable, record, pattern matching.', '2026-06-18', '2026-07-01', TimelineStatus.InProgress, 'Tech'),
      make(demoId, 'TypeScript chuyên sâu', 'strict, generics, discriminated union, Zod.', '2026-07-01', '2026-07-14', TimelineStatus.Planned, 'Tech'),
      make(demoId, 'EF Core hiệu năng', 'N+1, projection, AsNoTracking, optimistic concurrency.', '2026-07-15', '2026-07-28', TimelineStatus.Planned, 'Tech'),
      make(demoId, 'Clean Architecture + CQRS', 'Tách layer, MediatR, FluentValidation.', '2026-08-01', '2026-08-20', TimelineStatus.Planned, 'Tech'),

      make(demoId, 'NeetCode: Arrays & Hashing', 'Contains Duplicate, Two Sum, Group Anagrams, Top-K...', '2026-06-18', '2026-07-02', TimelineStatus.InProgress, 'Thuật toán'),
      make(demoId, 'NeetCode: Two Pointers & Sliding Window', '3Sum, Container With Most Water, Longest Substring...', '2026-07-03', '2026-07-20', TimelineStatus.Planned, 'Thuật toán'),
      make(demoId, 'NeetCode: Trees & Graphs', 'DFS/BFS, Level Order, Number of Islands, Course Schedule.', '2026-08-15', '2026-09-30', TimelineStatus.Planned, 'Thuật toán'),

      make(demoId, 'Dự án 1 — Ticketing System', 'Clean Architecture + CQRS + Auth + Testing, deploy live.', '2026-07-20', '2026-09-15', TimelineStatus.Planned, 'Dự án'),
      make(demoId, 'Dự án 2 — Quản lý kho', 'Optimistic concurrency, transaction, báo cáo.', '2026-09-16', '2026-11-20', TimelineStatus.Planned, 'Dự án'),

      make(demoId, 'IELTS Giai đoạn 1 — Xây nền', 'Ngữ pháp (Murphy) + từ vựng (Anki) + input.', '2026-06-18', '2026-09-18', TimelineStatus.InProgress, 'IELTS'),
      make(demoId, 'IELTS Giai đoạn 2 — Kỹ năng', 'Kỹ thuật từng dạng + gia sư Writing/Speaking.', '2026-09-19', '2026-12-18', TimelineStatus.Planned, 'IELTS'),
      make(demoId, 'IELTS Giai đoạn 3 — Luyện đề', 'Full mock test mỗi 1–2 tuần, tăng tốc lên 6.5.', '2026-12-19', '2027-03-15', TimelineStatus.Planned, 'IELTS'),
      make(demoId, 'Thi IELTS Academic (mục tiêu 6.5)', 'Đăng ký thi khi mock đạt 6.5 hai lần liên tiếp.', '2027-03-20', null, TimelineStatus.Planned, 'IELTS'),

      make(demoId, '🎯 Đạt Mid-level Developer', 'Kết hợp kỹ thuật vững + đưa sản phẩm ra production.', '2027-06-01', null, TimelineStatus.Planned, 'Mục tiêu'),

      // ----- Của admin (admin@timeline.local) — để minh hoạ "Admin xem tất cả" -----
      make(adminId, 'Review kiến trúc hệ thống', 'Rà soát kiến trúc tổng thể các dự án team.', '2026-06-20', '2026-06-30', TimelineStatus.InProgress, 'Quản trị'),
      make(adminId, 'Lập kế hoạch quý 3', 'Đặt mục tiêu & phân bổ nguồn lực.', '2026-07-01', '2026-07-05', TimelineStatus.Planned, 'Quản trị'),
    ];
  }
}
