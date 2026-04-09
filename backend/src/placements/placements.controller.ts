import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlacementsService } from './placements.service';
import {
  CreatePlacementDriveDto,
  ApplyPlacementDto,
  UpdateApplicationStatusDto,
} from './dto/placement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Placements / TPO')
@Controller('placements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlacementsController {
  constructor(private service: PlacementsService) {}

  // ── Drive Management (Admin only) ──

  @Post('drives')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TPO')
  @ApiOperation({ summary: 'Create placement drive' })
  async createDrive(@Req() req: any, @Body() dto: CreatePlacementDriveDto) {
    return this.service.createDrive(req.user.sub, dto);
  }

  @Get('drives')
  @ApiOperation({ summary: 'Get all placement drives' })
  async findAllDrives(@Query('all') all?: string) {
    return this.service.findAllDrives(all !== 'true');
  }

  @Get('drives/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TPO')
  @ApiOperation({ summary: 'Get placement statistics' })
  async getDriveStats() {
    return this.service.getDriveStats();
  }

  @Get('drives/:id')
  @ApiOperation({ summary: 'Get placement drive details with applications' })
  async findDriveById(@Param('id') id: string) {
    return this.service.findDriveById(id);
  }

  @Patch('drives/:id/toggle')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TPO')
  @ApiOperation({ summary: 'Toggle drive active/inactive' })
  async toggleDriveActive(@Param('id') id: string) {
    return this.service.toggleDriveActive(id);
  }

  // ── Student Applications ──

  @Post('drives/:id/apply')
  @UseGuards(RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Apply to a placement drive (Students only)' })
  async applyToDrive(
    @Param('id') driveId: string,
    @Req() req: any,
    @Body() dto: ApplyPlacementDto,
  ) {
    return this.service.applyToDrive(driveId, req.user.sub, dto.resume);
  }

  @Get('my-applications')
  @UseGuards(RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get my placement applications (Students)' })
  async getMyApplications(@Req() req: any) {
    return this.service.getMyApplications(req.user.sub);
  }

  @Patch('applications/:id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TPO')
  @ApiOperation({ summary: 'Update application status (Admin)' })
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.service.updateApplicationStatus(id, dto);
  }
}
