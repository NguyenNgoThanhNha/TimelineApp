import { PartialType } from '@nestjs/swagger';
import { CreateTimelineDto } from './create-timeline.dto';

// Cho phép cập nhật một phần — mọi field optional, validation kế thừa từ CreateTimelineDto.
export class UpdateTimelineDto extends PartialType(CreateTimelineDto) {}
