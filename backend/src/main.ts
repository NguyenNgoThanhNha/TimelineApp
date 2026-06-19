import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Cho phép frontend gọi (khi chạy Docker đã có nginx proxy nên thường không cần)
  app.enableCors({ origin: true, credentials: true });

  // Validation toàn cục: loại field thừa + tự ép kiểu
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Bọc response + xử lý lỗi theo khuôn chung
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Timeline API')
    .setDescription('Quản lý timeline cá nhân — NestJS + Prisma + MongoDB')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API:     http://localhost:${port}/api/timelines`);
  console.log(`Swagger: http://localhost:${port}/swagger`);
}

bootstrap();
