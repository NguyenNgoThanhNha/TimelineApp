import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Timeline, TimelineStatus, User } from '@prisma/client';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

type ReminderTimeline = Pick<
  Timeline,
  'id' | 'title' | 'description' | 'startDate' | 'endDate' | 'status' | 'category'
> & {
  user: Pick<User, 'email' | 'name'>;
};

@Injectable()
export class ZaloReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ZaloReminderService.name);
  private readonly sentTimelineIds = new Set<string>();
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const enabled = this.config.get<boolean>('zaloReminder.enabled') ?? false;
    if (!enabled) return;

    const intervalMinutes = this.config.get<number>('zaloReminder.intervalMinutes') ?? 60;
    const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

    void this.sendScheduledUpcomingReminders();
    this.interval = setInterval(() => {
      void this.sendScheduledUpcomingReminders();
    }, intervalMs);
    this.interval.unref?.();

    this.logger.log(`Đã bật nhắc lịch Zalo mỗi ${intervalMinutes} phút.`);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async sendUpcomingForUser(user: CurrentUserPayload) {
    const items = await this.findUpcomingTimelines(this.ownerScope(user));
    return this.sendItems(items, false);
  }

  async sendSelectedForUser(user: CurrentUserPayload, timelineIds: string[]) {
    if (!timelineIds.length) {
      throw new BadRequestException('Vui lòng chọn ít nhất một task để nhắc lịch.');
    }

    const items = await this.prisma.timeline.findMany({
      where: {
        ...this.ownerScope(user),
        id: { in: timelineIds },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    if (items.length !== timelineIds.length) {
      throw new BadRequestException('Một hoặc nhiều task không tồn tại hoặc bạn không có quyền gửi.');
    }

    return this.sendItems(items, false);
  }

  private async sendScheduledUpcomingReminders() {
    try {
      const items = await this.findUpcomingTimelines({});
      const unsent = items.filter((item) => !this.sentTimelineIds.has(item.id));
      const result = await this.sendItems(unsent, true);

      for (const item of unsent) {
        this.sentTimelineIds.add(item.id);
      }

      return result;
    } catch (error) {
      this.logger.error(`Gửi nhắc lịch Zalo thất bại: ${(error as Error).message}`);
      return { sent: false, total: 0, reason: (error as Error).message };
    }
  }

  private async findUpcomingTimelines(whereScope: Prisma.TimelineWhereInput) {
    const now = new Date();
    const lookAheadHours = this.config.get<number>('zaloReminder.lookAheadHours') ?? 24;
    const until = new Date(now.getTime() + lookAheadHours * 60 * 60 * 1000);

    return this.prisma.timeline.findMany({
      where: {
        ...whereScope,
        status: { in: [TimelineStatus.Planned, TimelineStatus.InProgress] },
        startDate: { gte: now, lte: until },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  private async sendItems(items: ReminderTimeline[], markAsScheduled: boolean) {
    if (!items.length) {
      return { sent: false, total: 0, reason: 'Không có timeline sắp tới trong khung nhắc.' };
    }

    const endpoint = this.config.get<string>('zaloReminder.endpoint');
    const chatId = this.config.get<string>('zaloReminder.chatId');
    if (!endpoint || !chatId) {
      throw new Error('Thiếu ZALO_BOT_ENDPOINT hoặc ZALO_CHAT_ID.');
    }

    const payload = {
      chat_id: chatId,
      text: this.buildMessage(items),
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Zalo API trả ${response.status}: ${responseText}`);
    }

    this.logger.log(
      `${markAsScheduled ? 'Tự động gửi' : 'Gửi thủ công'} ${items.length} nhắc lịch qua Zalo.`,
    );

    return { sent: true, total: items.length, response: responseText };
  }

  private buildMessage(items: ReminderTimeline[]) {
    const lookAheadHours = this.config.get<number>('zaloReminder.lookAheadHours') ?? 24;
    let message = `🔔 Nhắc lịch Timeline\n\nCó ${items.length} mốc sắp bắt đầu trong ${lookAheadHours} giờ tới:\n\n`;

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.title}\n`;
      message += `   • Thời gian: ${this.formatDate(item.startDate)}${item.endDate ? ` → ${this.formatDate(item.endDate)}` : ''}\n`;
      message += `   • Danh mục: ${item.category} · Trạng thái: ${item.status}\n`;
      message += `   • Người phụ trách: ${item.user.name} (${item.user.email})\n`;
      if (item.description) {
        message += `   • Ghi chú: ${item.description}\n`;
      }
      message += '\n';
    });

    return message.trim();
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(value);
  }

  private ownerScope(user: CurrentUserPayload): Prisma.TimelineWhereInput {
    return user.role === 'Admin' ? {} : { userId: user.userId };
  }
}
