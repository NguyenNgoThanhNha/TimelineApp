import { ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel, LearningStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/** Chỉ cho sửa phần do người học tự quản lý — dữ liệu từ điển phải đi qua /refresh. */
export class UpdateVocabularyDto {
  @ApiPropertyOptional({ description: 'Ghi chú riêng. Gửi chuỗi rỗng để xoá.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({ enum: LearningStatus })
  @IsOptional()
  @IsEnum(LearningStatus, { message: 'Trạng thái học không hợp lệ' })
  learningStatus?: LearningStatus;

  @ApiPropertyOptional({ enum: CefrLevel, description: 'Tự chỉnh trình độ khi API không có dữ liệu' })
  @IsOptional()
  @IsEnum(CefrLevel, { message: 'Trình độ CEFR không hợp lệ' })
  cefrLevel?: CefrLevel;
}
