import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

// Cập nhật một phần — validation kế thừa từ CreatePostDto.
export class UpdatePostDto extends PartialType(CreatePostDto) {}
