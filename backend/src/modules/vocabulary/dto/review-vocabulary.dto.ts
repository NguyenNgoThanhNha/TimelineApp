import { ApiProperty } from '@nestjs/swagger';
import { ReviewResult } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ReviewVocabularyDto {
  @ApiProperty({
    enum: ReviewResult,
    description: 'Kết quả tự đánh giá trên flashcard — đầu vào của thuật toán spaced repetition',
    example: ReviewResult.Good,
  })
  @IsEnum(ReviewResult, { message: 'Kết quả ôn tập không hợp lệ' })
  result!: ReviewResult;
}
