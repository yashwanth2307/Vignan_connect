import { Module } from '@nestjs/common';
import { CodeArenaService } from './code-arena.service';
import { CodeArenaController } from './code-arena.controller';

@Module({
  controllers: [CodeArenaController],
  providers: [CodeArenaService],
  exports: [CodeArenaService],
})
export class CodeArenaModule {}
