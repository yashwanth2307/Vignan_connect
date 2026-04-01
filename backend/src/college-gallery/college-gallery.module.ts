import { Module } from '@nestjs/common';
import { CollegeGalleryService } from './college-gallery.service';
import { CollegeGalleryController } from './college-gallery.controller';

@Module({
  controllers: [CollegeGalleryController],
  providers: [CollegeGalleryService],
})
export class CollegeGalleryModule {}
