import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimelineStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTimelineDto {
  @ApiProperty({ example: 'Học NestJS + Prisma' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề là bắt buộc' })
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Tìm hiểu module, service, Prisma ODM...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2026-06-18' })
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate?: string;

  @ApiProperty({ enum: TimelineStatus, example: TimelineStatus.Planned })
  @IsEnum(TimelineStatus, { message: 'Trạng thái không hợp lệ' })
  status!: TimelineStatus;

  @ApiProperty({ example: 'Tech' })
  @IsString()
  @IsNotEmpty({ message: 'Danh mục là bắt buộc' })
  @MaxLength(80)
  category!: string;
}
