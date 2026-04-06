import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('events')
export class EventsController {
    constructor(private readonly events: EventsService) {}

    @Get()
    getEvents() {
        return this.events.getEvents();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'HOD', 'FACULTY')
    createEvent(@Req() req: any, @Body() body: any) {
        return this.events.createEvent(req.user.sub, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'HOD')
    deleteEvent(@Param('id') id: string) {
        return this.events.deleteEvent(id);
    }

    @Post(':id/register')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STUDENT')
    registerEvent(@Req() req: any, @Param('id') id: string) {
        return this.events.registerForEvent(id, req.user.sub);
    }

    @Get(':id/registrations')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'FACULTY', 'HOD')
    getRegistrations(@Param('id') id: string) {
        return this.events.getRegistrations(id);
    }
}
