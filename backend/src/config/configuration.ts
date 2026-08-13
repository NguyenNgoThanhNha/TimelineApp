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
  // Seed dữ liệu demo. Mặc định chỉ chạy khi database trống — bật cờ này
  // để xoá sạch và dựng lại bộ demo mỗi lần khởi động (CHỈ dùng khi phát triển).
  seed: {
    resetOnStartup: process.env.SEED_RESET_ON_STARTUP === 'true',
  },
  // Job tự đăng bài blog đã hẹn giờ (mặc định bật, quét mỗi 30 phút)
  postSchedule: {
    enabled: process.env.POST_SCHEDULE_ENABLED !== 'false',
    intervalMinutes: parseInt(process.env.POST_SCHEDULE_INTERVAL_MINUTES ?? '30', 10),
  },
  // Nguồn dữ liệu cho module từ vựng. Mỗi provider tắt được độc lập.
  vocabulary: {
    dictionary: {
      // Free Dictionary API — không cần key, cho IPA + audio + definition + synonym
      endpoint:
        process.env.VOCAB_DICTIONARY_ENDPOINT ?? 'https://api.dictionaryapi.dev/api/v2/entries/en',
      timeoutMs: parseInt(process.env.VOCAB_DICTIONARY_TIMEOUT_MS ?? '8000', 10),
    },
    // Gợi ý từ đúng khi user gõ sai (Datamuse, không cần key)
    spellSuggestion: {
      endpoint: process.env.VOCAB_SPELL_ENDPOINT ?? 'https://api.datamuse.com/words',
      timeoutMs: parseInt(process.env.VOCAB_SPELL_TIMEOUT_MS ?? '5000', 10),
    },
    // Dịch dự phòng khi không cấu hình AI (MyMemory, không cần key)
    translation: {
      enabled: process.env.VOCAB_TRANSLATION_ENABLED !== 'false',
      endpoint: process.env.VOCAB_TRANSLATION_ENDPOINT ?? 'https://api.mymemory.translated.net/get',
      // MyMemory nới quota nếu gửi kèm email
      contactEmail: process.env.VOCAB_TRANSLATION_EMAIL ?? '',
      timeoutMs: parseInt(process.env.VOCAB_TRANSLATION_TIMEOUT_MS ?? '8000', 10),
    },
    // Claude — bổ sung nghĩa tiếng Việt, câu ví dụ theo cấp độ, dạng khác của từ, CEFR
    ai: {
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
      model: process.env.VOCAB_AI_MODEL ?? 'claude-opus-5',
      endpoint: process.env.VOCAB_AI_ENDPOINT ?? 'https://api.anthropic.com/v1/messages',
      timeoutMs: parseInt(process.env.VOCAB_AI_TIMEOUT_MS ?? '60000', 10),
    },
  },
});
