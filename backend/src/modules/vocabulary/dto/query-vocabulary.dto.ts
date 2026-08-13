import { ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel, EnrichmentStatus, LearningStatus, PartOfSpeech } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Cách sắp xếp danh sách từ vựng. */
export enum VocabularySort {
  Recent = 'recent', // mới học gần nhất
  Oldest = 'oldest', // cũ nhất
  Az = 'az',
  Za = 'za',
}

export class QueryVocabularyDto {
  @ApiPropertyOptional({ description: 'Tìm theo từ tiếng Anh, nghĩa tiếng Việt hoặc synonym' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PartOfSpeech })
  @IsOptional()
  @IsEnum(PartOfSpeech, { message: 'Loại từ không hợp lệ' })
  partOfSpeech?: PartOfSpeech;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel, { message: 'Trình độ CEFR không hợp lệ' })
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional({ enum: LearningStatus })
  @IsOptional()
  @IsEnum(LearningStatus, { message: 'Trạng thái học không hợp lệ' })
  learningStatus?: LearningStatus;

  @ApiPropertyOptional({ enum: EnrichmentStatus })
  @IsOptional()
  @IsEnum(EnrichmentStatus, { message: 'Trạng thái tra cứu không hợp lệ' })
  enrichmentStatus?: EnrichmentStatus;

  @ApiPropertyOptional({ description: 'Lọc theo đúng ngày học', example: '2026-08-13' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày học không hợp lệ' })
  date?: string;

  @ApiPropertyOptional({ enum: VocabularySort, default: VocabularySort.Recent })
  @IsOptional()
  @IsEnum(VocabularySort, { message: 'Kiểu sắp xếp không hợp lệ' })
  sort?: VocabularySort;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
