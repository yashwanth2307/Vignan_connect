import { Module } from '@nestjs/common';
import { CollegeMagazineService } from './college-magazine.service';
import { CollegeMagazineController } from './college-magazine.controller';

@Module({
  controllers: [CollegeMagazineController],
  providers: [CollegeMagazineService],
})
export class CollegeMagazineModule {}
