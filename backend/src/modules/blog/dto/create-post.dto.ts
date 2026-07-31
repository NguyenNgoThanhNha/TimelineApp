import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: '99 Ngày Spring — Ngày 03: IoC container & Bean' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề là bắt buộc' })
  @MaxLength(250)
  title!: string;

  @ApiPropertyOptional({ description: 'Slug tự sinh từ title nếu bỏ trống' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({ example: 'Bean là gì, ApplicationContext quản lý bean ra sao.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ description: 'Nội dung Markdown' })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung là bắt buộc' })
  content!: string;

  @ApiPropertyOptional({ description: 'URL ảnh bìa' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiProperty({ example: 'Backend' })
  @IsString()
  @IsNotEmpty({ message: 'Chuyên mục là bắt buộc' })
  @MaxLength(80)
  category!: string;

  @ApiPropertyOptional({ example: ['spring', 'spring-core'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  @ApiPropertyOptional({ description: 'Tên chuỗi bài', example: '99 Ngày .NET' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  series?: string | null;

  @ApiPropertyOptional({ description: 'Số thứ tự trong chuỗi', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seriesOrder?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    description:
      'Hẹn giờ đăng (ISO). Nếu ở tương lai, bài được giữ nháp và job nền sẽ tự đăng khi tới hạn.',
    example: '2026-08-05T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Thời điểm hẹn đăng không hợp lệ' })
  scheduledAt?: string | null;

  @ApiPropertyOptional({ description: 'Id các task được gắn với bài viết' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Id task không hợp lệ' })
  timelineIds?: string[];
}
