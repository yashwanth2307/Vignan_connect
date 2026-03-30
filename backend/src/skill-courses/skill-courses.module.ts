import { Module } from '@nestjs/common';
import { SkillCoursesController } from './skill-courses.controller';
import { SkillCoursesService } from './skill-courses.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SkillCoursesController],
  providers: [SkillCoursesService],
  exports: [SkillCoursesService],
})
export class SkillCoursesModule {}
