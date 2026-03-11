import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminBotService } from './admin-bot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin Bot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin-bot')
export class AdminBotController {
    constructor(private service: AdminBotService) { }

    @Post('command')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Execute an AI admin command (natural language)' })
    async executeCommand(@Body() body: { message: string }) {
        return this.service.processCommand(body.message);
    }

    @Post('preview')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Preview what an AI command would do (dry run)' })
    async previewCommand(@Body() body: { message: string }) {
        return this.service.previewCommand(body.message);
    }
}
