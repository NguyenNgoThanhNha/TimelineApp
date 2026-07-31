import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'Spring Framework — Core Technologies' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề là bắt buộc' })
  @MaxLength(250)
  title!: string;

  @ApiProperty({ example: 'https://docs.spring.io/spring-framework/reference/core.html' })
  @IsUrl({ require_protocol: true }, { message: 'Link không hợp lệ' })
  @MaxLength(1000)
  url!: string;

  @ApiPropertyOptional({ enum: ResourceType, default: ResourceType.Article })
  @IsOptional()
  @IsEnum(ResourceType, { message: 'Loại tài nguyên không hợp lệ' })
  type?: ResourceType;

  @ApiPropertyOptional({ description: 'Ghi chú ngắn: đọc phần nào, tại sao nên đọc' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'Id task không hợp lệ' })
  timelineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'Id bài viết không hợp lệ' })
  postId?: string;
}
