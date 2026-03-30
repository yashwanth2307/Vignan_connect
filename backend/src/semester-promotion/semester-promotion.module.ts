import { Module } from '@nestjs/common';
import { SemesterPromotionController } from './semester-promotion.controller';
import { SemesterPromotionService } from './semester-promotion.service';

@Module({
  controllers: [SemesterPromotionController],
  providers: [SemesterPromotionService],
})
export class SemesterPromotionModule {}
