import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private service: AssignmentsService) {}

  @Post()
  @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create assignment' })
  create(@Body() body: any, @Req() req: any) {
    return this.service.create({ ...body, createdById: req.user.sub });
  }

  @Get('student/my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student assignments' })
  getStudentAssignments(@Req() req: any) {
    return this.service.getStudentAssignments(req.user.sub);
  }

  @Get('course-offering/:coId')
  @ApiOperation({ summary: 'Get assignments by course offering' })
  getByCourseOffering(@Param('coId') coId: string) {
    return this.service.findByCourseOffering(coId);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/assignments',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF files are allowed for assignment submissions!'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Submit/Resubmit assignment (PDF file upload)' })
  submitAssignment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { fileUrl?: string },
    @Req() req: any,
  ) {
    const finalUrl = file ? `/uploads/assignments/${file.filename}` : body.fileUrl;
    if (!finalUrl) throw new BadRequestException('A PDF file must be provided');
    return this.service.submitAssignment(id, finalUrl, req.user.sub);
  }

  @Patch('submissions/:id/flag')
  @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN)
  @ApiOperation({ summary: 'Flag submission for resubmission with remarks' })
  flagSubmission(
    @Param('id') id: string,
    @Body() body: { remarks: string },
    @Req() req: any,
  ) {
    return this.service.flagSubmission(id, body.remarks || '', req.user.sub);
  }

  @Patch('submissions/:id/grade')
  @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN)
  @ApiOperation({ summary: 'Grade submission' })
  gradeSubmission(
    @Param('id') id: string,
    @Body() body: { grade: string },
    @Req() req: any,
  ) {
    return this.service.gradeSubmission(id, body.grade, req.user.sub);
  }
}
