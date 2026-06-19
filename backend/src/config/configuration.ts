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
});
