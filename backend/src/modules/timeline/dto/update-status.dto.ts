import { ApiProperty } from '@nestjs/swagger';
import { TimelineStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

// Chỉ đổi trạng thái — dùng cho kéo-thả Kanban
export class UpdateStatusDto {
  @ApiProperty({ enum: TimelineStatus })
  @IsEnum(TimelineStatus, { message: 'Trạng thái không hợp lệ' })
  status!: TimelineStatus;
}
