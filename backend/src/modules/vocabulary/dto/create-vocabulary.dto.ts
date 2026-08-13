import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVocabularyDto {
  @ApiProperty({ example: 'achieve', description: 'Từ tiếng Anh vừa học (tự trim khoảng trắng)' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập từ vựng' })
  @MaxLength(80)
  word!: string;

  @ApiPropertyOptional({ description: 'Ghi chú riêng của người học' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Ngày học (ISO). Bỏ trống = hôm nay theo giờ Việt Nam.',
    example: '2026-08-13',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày học không hợp lệ' })
  learnedDate?: string;
}
