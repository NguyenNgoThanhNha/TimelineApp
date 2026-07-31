import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';

// Tham số lọc/phân trang cho GET /api/posts
export class QueryPostDto {
  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề / tóm tắt / nội dung' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo chuyên mục (slug hoặc tên)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Lọc theo thẻ' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Lọc theo chuỗi bài (tên hoặc slug)' })
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ description: 'Chỉ lấy bài gắn với task này' })
  @IsOptional()
  @IsMongoId({ message: 'Id task không hợp lệ' })
  timelineId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
