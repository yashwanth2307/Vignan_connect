import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SemesterPromotionService } from './semester-promotion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Semester Promotion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('semester-promotion')
export class SemesterPromotionController {
  constructor(private readonly service: SemesterPromotionService) {}

  @Get('candidates')
  @Roles(UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({
    summary: 'Get list of students eligible for promotion based on criteria',
  })
  getCandidates(
    @Query('departmentId') departmentId: string,
    @Query('batchStartYear') batchStartYear: string,
    @Query('batchEndYear') batchEndYear: string,
    @Query('currentSemester') currentSemester: string,
  ) {
    return this.service.getPromotionCandidates({
      departmentId,
      batchStartYear: parseInt(batchStartYear),
      batchEndYear: parseInt(batchEndYear),
      currentSemester: parseInt(currentSemester),
    });
  }

  @Post('execute')
  @Roles(UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'Execute promotion for eligible students' })
  executePromotion(
    @Body()
    body: {
      departmentId: string;
      batchStartYear: number;
      batchEndYear: number;
      currentSemester: number;
      academicYear: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.service.executePromotion({ ...body, userId: req.user.sub });
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.HOD)
  @ApiOperation({ summary: 'Get history of promotions' })
  getHistory(@Query('departmentId') departmentId?: string) {
    return this.service.getPromotionHistory(departmentId);
  }
}
