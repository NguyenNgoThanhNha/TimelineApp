import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — theo convention của NestApiTemplate (extends PrismaClient,
 * lấy connection string từ ConfigService). Đổi sang MongoDB: dùng datasource url
 * trực tiếp (không cần adapter như bản SQL Server).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const url = config.get<string>('database.connectionString');
    if (!url) {
      throw new Error('DATABASE_URL chưa được cấu hình');
    }
    super({ datasources: { db: { url } } });
  }

  async onModuleInit() {
    // Retry: MongoDB (replica set) có thể chưa sẵn sàng ngay khi backend khởi động
    const maxAttempts = 12;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log(`Đã kết nối MongoDB (lần thử ${attempt}).`);
        return;
      } catch (err) {
        this.logger.warn(
          `MongoDB chưa sẵn sàng (lần ${attempt}/${maxAttempts}): ${(err as Error).message}`,
        );
        if (attempt === maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
