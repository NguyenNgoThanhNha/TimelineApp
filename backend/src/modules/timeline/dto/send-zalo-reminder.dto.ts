import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class SendZaloReminderDto {
  @ApiPropertyOptional({
    description: 'Danh sách timeline id cần gửi nhắc lịch. Bỏ trống để gửi các mốc sắp tới.',
    example: ['64d2f4f9c9f1a2b3c4d5e6f7'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  timelineIds?: string[];
}
