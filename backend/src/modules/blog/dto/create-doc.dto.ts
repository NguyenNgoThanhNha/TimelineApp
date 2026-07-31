import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDocDto {
  @ApiProperty({ example: 'Cheatsheet: các annotation khai báo bean' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề là bắt buộc' })
  @MaxLength(250)
  title!: string;

  @ApiPropertyOptional({ description: 'Slug tự sinh từ title nếu bỏ trống' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ description: 'Nội dung Markdown' })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung là bắt buộc' })
  content!: string;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị trong task', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Task mà tài liệu này đính kèm' })
  @IsOptional()
  @IsMongoId({ message: 'Id task không hợp lệ' })
  timelineId?: string;

  @ApiPropertyOptional({ description: 'Bài blog mà tài liệu này đính kèm' })
  @IsOptional()
  @IsMongoId({ message: 'Id bài viết không hợp lệ' })
  postId?: string;
}
