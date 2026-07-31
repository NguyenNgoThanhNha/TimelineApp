// Cấu hình tập trung, nạp từ biến môi trường (giống convention của NestApiTemplate).
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    connectionString: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-please-change',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  zaloReminder: {
    enabled: process.env.ZALO_REMINDER_ENABLED === 'true',
    endpoint: process.env.ZALO_BOT_ENDPOINT ?? '',
    chatId: process.env.ZALO_CHAT_ID ?? '',
    lookAheadHours: parseInt(process.env.ZALO_REMINDER_LOOKAHEAD_HOURS ?? '24', 10),
    intervalMinutes: parseInt(process.env.ZALO_REMINDER_INTERVAL_MINUTES ?? '60', 10),
  },
  // Job tự đăng bài blog đã hẹn giờ (mặc định bật, quét mỗi 30 phút)
  postSchedule: {
    enabled: process.env.POST_SCHEDULE_ENABLED !== 'false',
    intervalMinutes: parseInt(process.env.POST_SCHEDULE_INTERVAL_MINUTES ?? '30', 10),
  },
});
