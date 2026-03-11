import { Module } from '@nestjs/common';
import { AdminBotController } from './admin-bot.controller';
import { AdminBotService } from './admin-bot.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminBotController],
    providers: [AdminBotService],
})
export class AdminBotModule { }
