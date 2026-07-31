import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

// Tham số lọc cho GET /api/docs và GET /api/resources
export class QueryDocDto {
  @ApiPropertyOptional({ description: 'Lọc theo task' })
  @IsOptional()
  @IsMongoId({ message: 'Id task không hợp lệ' })
  timelineId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo bài blog' })
  @IsOptional()
  @IsMongoId({ message: 'Id bài viết không hợp lệ' })
  postId?: string;

  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề / tóm tắt' })
  @IsOptional()
  @IsString()
  search?: string;
}
