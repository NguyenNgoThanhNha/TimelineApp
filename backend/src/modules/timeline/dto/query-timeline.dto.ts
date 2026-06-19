import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimelineStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

// Tham số lọc cho GET /api/timelines
export class QueryTimelineDto {
  @ApiPropertyOptional({ description: 'Tìm theo title hoặc description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TimelineStatus })
  @IsOptional()
  @IsEnum(TimelineStatus)
  status?: TimelineStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Lọc startDate >= from (ISO date)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc startDate <= to (ISO date)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
