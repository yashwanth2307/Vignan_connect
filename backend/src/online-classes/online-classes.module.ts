import { Module } from '@nestjs/common';
import { OnlineClassesService } from './online-classes.service';
import { OnlineClassesController } from './online-classes.controller';

@Module({
    controllers: [OnlineClassesController],
    providers: [OnlineClassesService],
})
export class OnlineClassesModule { }
