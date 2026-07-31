import { Module } from '@nestjs/common';
import { DocController } from './controllers/doc.controller';
import { PostController } from './controllers/post.controller';
import { ResourceController } from './controllers/resource.controller';
import { DocService } from './services/doc.service';
import { PostService } from './services/post.service';
import { ResourceService } from './services/resource.service';

/**
 * Blog + tài liệu: bài viết tổng hợp kiến thức (Markdown), trang tài liệu nội bộ
 * và link tài nguyên ngoài — tất cả đều gắn được với task trong Timeline.
 */
@Module({
  controllers: [PostController, DocController, ResourceController],
  providers: [PostService, DocService, ResourceService],
})
export class BlogModule {}
