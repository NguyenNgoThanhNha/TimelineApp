import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Job nền tự phát hành bài viết đã hẹn giờ.
 *
 * Bài có `scheduledAt` nằm ở tương lai được giữ ở trạng thái nháp (`published = false`);
 * tới hạn thì job chuyển sang công khai và lấy luôn `scheduledAt` làm ngày đăng.
 * Chạy một lần lúc khởi động (bù cho khoảng thời gian server tắt) rồi lặp theo chu kỳ.
 *
 * Cấu hình: POST_SCHEDULE_ENABLED (mặc định bật), POST_SCHEDULE_INTERVAL_MINUTES (mặc định 30).
 */
@Injectable()
export class PostScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostScheduleService.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const enabled = this.config.get<boolean>('postSchedule.enabled') ?? true;
    if (!enabled) {
      this.logger.log('Job tự đăng bài theo lịch đang tắt (POST_SCHEDULE_ENABLED=false).');
      return;
    }

    const intervalMinutes = Math.max(
      this.config.get<number>('postSchedule.intervalMinutes') ?? 30,
      1,
    );

    void this.publishDuePosts();
    this.interval = setInterval(() => void this.publishDuePosts(), intervalMinutes * 60 * 1000);
    this.interval.unref?.(); // không giữ process sống chỉ vì timer

    this.logger.log(`Đã bật job tự đăng bài theo lịch, quét mỗi ${intervalMinutes} phút.`);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * Phát hành mọi bài đã tới hạn. Trả về danh sách bài vừa đăng
   * (controller dùng lại để chạy tay khi cần kiểm tra).
   */
  async publishDuePosts(now: Date = new Date()) {
    try {
      const due = await this.prisma.post.findMany({
        where: { published: false, scheduledAt: { not: null, lte: now } },
        select: { id: true, slug: true, title: true, scheduledAt: true },
        orderBy: { scheduledAt: 'asc' },
      });

      if (!due.length) return { published: 0, items: [] };

      for (const post of due) {
        await this.prisma.post.update({
          where: { id: post.id },
          // Lấy ngày hẹn làm ngày đăng để thứ tự bài không phụ thuộc lúc job chạy
          data: { published: true, publishedAt: post.scheduledAt ?? now },
        });
      }

      this.logger.log(`Đã tự đăng ${due.length} bài tới hạn: ${due.map((p) => p.slug).join(', ')}`);
      return { published: due.length, items: due };
    } catch (error) {
      // Job nền không được phép làm sập app — chỉ log rồi chờ lượt quét sau
      this.logger.error(`Không chạy được job đăng bài theo lịch: ${(error as Error).message}`);
      return { published: 0, items: [] };
    }
  }
}
