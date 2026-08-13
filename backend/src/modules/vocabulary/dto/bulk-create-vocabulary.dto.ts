import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkCreateVocabularyDto {
  @ApiProperty({
    description: 'Danh sách từ (frontend tách theo dòng). Backend tự trim và loại trùng.',
    example: ['achieve', 'maintain', 'significant', 'approach'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Vui lòng nhập ít nhất một từ' })
  @ArrayMaxSize(100, { message: 'Mỗi lần chỉ thêm tối đa 100 từ' })
  @IsString({ each: true })
  words!: string[];

  @ApiPropertyOptional({ description: 'Ngày học chung cho cả lô (ISO). Bỏ trống = hôm nay.' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày học không hợp lệ' })
  learnedDate?: string;
}
