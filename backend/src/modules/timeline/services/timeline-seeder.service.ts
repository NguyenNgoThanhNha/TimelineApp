import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, Role, TimelineStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Reset database khi backend khởi động rồi seed lại dữ liệu roadmap.
 *  - admin@timeline.local / Admin@123  (Admin — xem tất cả)
 *  - user@timeline.local  / User@123   (User  — chỉ xem của mình)
 *
 * Lưu ý: service này cố ý xoá toàn bộ users/timelines hiện tại để tạo bộ dữ liệu
 * mới dựa trên folder Roadmap.
 */
@Injectable()
export class TimelineSeederService implements OnModuleInit {
  private readonly logger = new Logger(TimelineSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.resetDatabase();

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

        await this.prisma.timeline.createMany({ data: this.seedData(demo.id, admin.id) });

        this.logger.log('Đã reset DB và seed 2 tài khoản demo + dữ liệu timeline từ Roadmap.');
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

  private async resetDatabase() {
    await this.prisma.timeline.deleteMany({});
    await this.prisma.user.deleteMany({});
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
      make(
        demoId,
        'Chuẩn bị chạy Roadmap tổng hợp',
        'Đọc lại folder Roadmap-Tong-Hop-Plan, chốt lịch học tuần đầu và chuẩn bị repo/Anki/sổ pattern.',
        '2026-07-25',
        '2026-07-26',
        TimelineStatus.InProgress,
        'Khởi động',
      ),

      make(
        demoId,
        'Tháng 1 — IELTS nền + Ticketing skeleton',
        'Diagnostic IELTS, Anki, Arrays & Hashing, C#/.NET core, TypeScript strict và skeleton Clean Architecture cho Dự án Ticketing.',
        '2026-07-27',
        '2026-08-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 2 — ASP.NET Core + EF Core + Ticketing CRUD',
        'Tập trung middleware, DI, ProblemDetails, EF projection/AsNoTracking, CQRS CRUD và UI list/form ticket.',
        '2026-08-27',
        '2026-09-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 3 — Auth, authorization, detail và test',
        'JWT, policy authorization, ticket detail, comment, status transition, unit test và IELTS mock #1.',
        '2026-09-27',
        '2026-10-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 4 — SLA, audit, dashboard, Docker/CI',
        'Chuyển IELTS sang dạng bài thật, thêm SLA background job, audit history, dashboard, Docker compose và GitHub Actions.',
        '2026-10-27',
        '2026-11-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 5 — Deploy Ticketing + khởi động Inventory',
        'Hoàn thiện tests, deploy Dự án 1 live, viết README/diagram và bắt đầu schema Inventory/Warehouse.',
        '2026-11-27',
        '2026-12-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 6 — Inventory concurrency + SQL nâng cao',
        'Goods receipt/issue, rowversion optimistic concurrency, transaction chuyển kho, kardex bằng CTE/window function và IELTS mock #2.',
        '2026-12-27',
        '2027-01-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 7 — Inventory UI lớn + Redis + NeetCode vòng 1',
        'Virtualized inventory table, Redis cache, import/export Excel, low-stock background job và hoàn thành/ôn NeetCode 150 vòng 1.',
        '2027-01-27',
        '2027-02-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 8 — Deploy Inventory + IELTS mock dày',
        'Hoàn thiện unit/integration tests, idempotency, Docker compose API + SQL + Redis, deploy Inventory live và mock IELTS liên tục.',
        '2027-02-27',
        '2027-03-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 9 — Thi IELTS hoặc chốt lịch thi',
        'Thi IELTS khi mock đạt 6.5 hai lần liên tiếp; polish Dự án 1-2 và chuẩn bị skeleton Dự án Order/Delivery.',
        '2027-03-27',
        '2027-04-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 10 — Order/Delivery event-driven core',
        'Modular Monolith, RabbitMQ, OrderCreated event, Inventory reserve, Outbox pattern và idempotent consumer.',
        '2027-04-27',
        '2027-05-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 11 — Saga, SignalR, resilience và DLQ',
        'Saga compensation, Delivery/Notification module, SignalR realtime, Polly retry/circuit breaker, dead-letter queue và correlation ID.',
        '2027-05-27',
        '2027-06-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),
      make(
        demoId,
        'Tháng 12 — Deploy Order/Delivery + chọn capstone',
        'Integration tests với broker, Docker compose full stack, CI/CD, deploy Dự án 3 và viết ADR tenancy cho Dự án 4.',
        '2027-06-27',
        '2027-07-26',
        TimelineStatus.Planned,
        'Roadmap 12 tháng',
      ),

      make(
        demoId,
        'IELTS Giai đoạn 1 — Xây nền',
        'Grammar bằng Murphy, 15-20 từ/cụm mỗi ngày qua Anki, graded reading, listening dễ, dictation và shadowing.',
        '2026-07-27',
        '2026-10-26',
        TimelineStatus.Planned,
        'IELTS',
      ),
      make(
        demoId,
        'IELTS Giai đoạn 2 — Kỹ năng IELTS',
        'Luyện dạng câu hỏi Listening/Reading, Writing Task 1/2, Speaking Part 1/2/3 và feedback Writing/Speaking.',
        '2026-10-27',
        '2027-01-26',
        TimelineStatus.Planned,
        'IELTS',
      ),
      make(
        demoId,
        'IELTS Giai đoạn 3 — Luyện đề và tăng tốc',
        'Full mock mỗi 1-2 tuần, error log sau mỗi mock, nâng band Writing/Speaking và chỉ đăng ký thi khi mock đạt 6.5 ổn định.',
        '2027-01-27',
        '2027-04-26',
        TimelineStatus.Planned,
        'IELTS',
      ),
      make(
        demoId,
        'Thi IELTS Academic 6.5',
        'Mốc thi thật hoặc quyết định dời thi dựa trên kết quả mock. Không thi non nếu chưa đạt 6.5 hai lần liên tiếp.',
        '2027-04-20',
        null,
        TimelineStatus.Planned,
        'IELTS',
      ),

      make(
        demoId,
        'NeetCode Phase 1 — Nền tảng',
        'Arrays & Hashing, Two Pointers, Sliding Window, Stack và Binary Search. Mục tiêu: nhận diện pattern Easy/Medium phổ biến.',
        '2026-07-27',
        '2026-09-06',
        TimelineStatus.Planned,
        'Thuật toán',
      ),
      make(
        demoId,
        'NeetCode Phase 2 — Linked List, Trees, Heap',
        'Linked List, Trees, Tries và Priority Queue để đủ nền phỏng vấn Mid-level.',
        '2026-09-07',
        '2026-10-18',
        TimelineStatus.Planned,
        'Thuật toán',
      ),
      make(
        demoId,
        'NeetCode Phase 3 — Backtracking và Graphs',
        'Subsets, permutations, BFS/DFS, Number of Islands, Course Schedule và graph patterns.',
        '2026-10-19',
        '2026-11-29',
        TimelineStatus.Planned,
        'Thuật toán',
      ),
      make(
        demoId,
        'NeetCode Phase 4 — DP và các topic còn lại',
        '1-D DP, 2-D DP, Greedy, Intervals, Math/Geometry và Bit Manipulation. DP là phần khó, ưu tiên hiểu pattern.',
        '2026-11-30',
        '2027-01-24',
        TimelineStatus.Planned,
        'Thuật toán',
      ),
      make(
        demoId,
        'Ôn NeetCode vòng 2 + mock interview',
        'Làm lại bài khó, viết sổ pattern, mock interview nhẹ và liên hệ Big-O vào code công ty.',
        '2027-01-25',
        '2027-03-26',
        TimelineStatus.Planned,
        'Thuật toán',
      ),

      make(
        demoId,
        'Dự án 1 — Ticketing/Helpdesk',
        'Clean Architecture, CQRS, JWT auth, policy authorization, TanStack Query, RHF/Zod, SLA, audit, tests, Docker, CI và deploy live.',
        '2026-07-27',
        '2026-12-26',
        TimelineStatus.Planned,
        'Dự án 1',
      ),
      make(
        demoId,
        'Dự án 2 — Inventory/Warehouse',
        'Concurrency bằng rowversion, transaction, StockMovement, Kardex SQL, Redis cache, import/export Excel, bảng lớn và deploy live.',
        '2026-12-27',
        '2027-03-26',
        TimelineStatus.Planned,
        'Dự án 2',
      ),
      make(
        demoId,
        'Dự án 3 — Order & Delivery Event-driven',
        'RabbitMQ, Outbox, idempotent consumer, Saga, SignalR realtime, Polly, dead-letter queue, correlation ID và deploy full stack.',
        '2027-04-27',
        '2027-07-26',
        TimelineStatus.Planned,
        'Dự án 3',
      ),
      make(
        demoId,
        'Dự án 4 — SaaS Multi-tenant Capstone',
        'TenantContext, global query filter, test cô lập tenant, DDD tactical, Blob Storage, permission matrix, CI/CD đầy đủ và monitoring.',
        '2027-07-27',
        '2027-10-26',
        TimelineStatus.Planned,
        'Dự án 4',
      ),

      make(
        demoId,
        '90 ngày đầu — Tuần 1: khởi tạo nền',
        'Diagnostic IELTS, tạo Anki, làm Contains Duplicate/Valid Anagram/Two Sum/Group Anagrams và dựng skeleton Ticketing 4 layer.',
        '2026-07-27',
        '2026-08-02',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 2: C# core + migration đầu',
        'Grammar/vocab, Top K/Product Except Self/Valid Sudoku, học async/IQueryable và tạo AppDbContext + migration.',
        '2026-08-03',
        '2026-08-09',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 3: TypeScript strict + list API',
        'Reading/Anki/shadowing, Two Pointers basic, ApiResponse<T>, Zod schema và endpoint GET /tickets.',
        '2026-08-10',
        '2026-08-16',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 4: CQRS create ticket',
        'Writing cơ bản, Sliding Window basic, CreateTicketCommand, GetTicketsQuery, MediatR và FluentValidation.',
        '2026-08-17',
        '2026-08-23',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 5: ProblemDetails + API chuẩn',
        'IELTS nền tiếp tục, Sliding Window nâng cao, ASP.NET Core middleware/DI/ProblemDetails và exception handling tập trung.',
        '2026-08-24',
        '2026-08-30',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 6: EF Core performance',
        'Stack pattern, projection, AsNoTracking, SQL logging, list ticket filter/pagination/sort và note N+1.',
        '2026-08-31',
        '2026-09-06',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 7: React list bằng TanStack Query',
        'Binary Search, setup React/TS/TanStack Query/Axios service layer/router và màn TicketsList.',
        '2026-09-07',
        '2026-09-13',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 8: RHF/Zod form tạo ticket',
        'Linked List cơ bản, form tạo ticket bằng React Hook Form + Zod, mutation và invalidate query.',
        '2026-09-14',
        '2026-09-20',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 9: JWT auth',
        'Linked List nâng cao, login endpoint, JWT access token, Axios interceptor và protected route.',
        '2026-09-21',
        '2026-09-27',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 10: policy authorization',
        'Trees cơ bản, roles Customer/Agent/Admin, policy chủ ticket hoặc agent/admin mới xem được ticket.',
        '2026-09-28',
        '2026-10-04',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 11: detail, comment, status transition',
        'Trees tiếp tục, ticket detail UI, comment API/UI và chặn trạng thái không hợp lệ ở backend.',
        '2026-10-05',
        '2026-10-11',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),
      make(
        demoId,
        '90 ngày đầu — Tuần 12: mock IELTS + test đầu tiên',
        'IELTS mock #1, error log, unit tests cho handler, FE test form ticket và README sơ bộ.',
        '2026-10-12',
        '2026-10-18',
        TimelineStatus.Planned,
        '90 ngày đầu',
      ),

      make(
        demoId,
        'Mục tiêu — IELTS Academic 6.5',
        'Đạt band 6.5 bằng chiến lược Listening/Reading kéo điểm, Writing/Speaking có feedback và mock ổn định trước khi thi.',
        '2027-04-26',
        null,
        TimelineStatus.Planned,
        'Mục tiêu',
      ),
      make(
        demoId,
        'Mục tiêu — Portfolio Mid-level',
        'Có ít nhất 2-3 dự án live với README, diagram, tests, Docker/CI/CD và minh chứng concurrency/event-driven.',
        '2027-07-26',
        null,
        TimelineStatus.Planned,
        'Mục tiêu',
      ),
      make(
        demoId,
        'Mục tiêu — Chạm ngưỡng Mid-level Web Developer',
        'Tự bóc feature mơ hồ, thiết kế end-to-end, debug có phương pháp, review code và đưa sản phẩm ra production.',
        '2027-07-26',
        null,
        TimelineStatus.Planned,
        'Mục tiêu',
      ),

      // ----- Của admin (admin@timeline.local) — để minh hoạ "Admin xem tất cả" -----
      make(
        adminId,
        'Admin — Theo dõi toàn bộ roadmap',
        'Tài khoản admin dùng để xem tất cả timeline của user và kiểm tra dashboard/category/status.',
        '2026-07-25',
        null,
        TimelineStatus.InProgress,
        'Quản trị',
      ),
      make(
        adminId,
        'Review tuần — IELTS, thuật toán, project',
        'Mỗi Chủ Nhật review active IELTS sessions, số bài thuật toán, output project, mức quá tải và điều chỉnh tuần sau.',
        '2026-07-27',
        '2027-07-26',
        TimelineStatus.Planned,
        'Review',
      ),
      make(
        adminId,
        'Review tháng — KPI và milestone',
        'Cuối mỗi tháng kiểm tra IELTS mock/error log, số bài NeetCode, milestone project, README/diagram và quyết định cắt scope nếu cần.',
        '2026-08-26',
        '2027-07-26',
        TimelineStatus.Planned,
        'Review',
      ),
    ];
  }
}
