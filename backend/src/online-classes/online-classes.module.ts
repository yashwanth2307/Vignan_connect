import { Module } from '@nestjs/common';
import { OnlineClassesService } from './online-classes.service';
import { OnlineClassesController } from './online-classes.controller';
import { ClassroomGateway } from './classroom.gateway';

@Module({
  controllers: [OnlineClassesController],
  providers: [OnlineClassesService, ClassroomGateway],
})
export class OnlineClassesModule {}
