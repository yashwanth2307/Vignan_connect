import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Clubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private service: ClubsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clubs' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club details' })
  getClub(@Param('id') id: string) {
    return this.service.getClub(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY)
  @ApiOperation({ summary: 'Create a new club' })
  createClub(
    @Body() body: { name: string; description?: string; category?: string; coordinatorId: string },
  ) {
    return this.service.createClub(body);
  }

  @Post(':id/join')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Join a club' })
  joinClub(@Req() req: any, @Param('id') id: string) {
    return this.service.joinClub(id, req.user.sub);
  }

  @Delete(':id/leave')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Leave a club' })
  leaveClub(@Req() req: any, @Param('id') id: string) {
    return this.service.leaveClub(id, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY)
  @ApiOperation({ summary: 'Delete a club' })
  deleteClub(@Param('id') id: string) {
    return this.service.deleteClub(id);
  }

  @Post(':id/events')
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Create a club event' })
  createEvent(
    @Param('id') id: string,
    @Body()
    body: { title: string; description?: string; date: string; venue?: string },
  ) {
    return this.service.createEvent(id, body);
  }
}
