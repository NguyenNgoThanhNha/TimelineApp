import { Module } from '@nestjs/common';
import { TimelineController } from './controllers/timeline.controller';
import { TimelineService } from './services/timeline.service';
import { TimelineSeederService } from './services/timeline-seeder.service';

@Module({
  controllers: [TimelineController],
  providers: [TimelineService, TimelineSeederService],
})
export class TimelineModule {}
