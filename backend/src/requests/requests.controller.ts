import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private prisma: PrismaService) {}

  // ── Create a request (any user) ──
  @Post()
  @ApiOperation({
    summary:
      'Create a new service request (leave, attendance correction, general)',
  })
  async create(
    @Req() req: any,
    @Body()
    body: {
      type: string;
      subject: string;
      message: string;
      toUserId: string;
      leaveFrom?: string;
      leaveTo?: string;
      leaveType?: string;
      rollNumbers?: string;
      correctionDate?: string;
      periodNumbers?: string;
      newStatus?: string;
    },
  ) {
    return this.prisma.serviceRequest.create({
      data: {
        type: body.type,
        subject: body.subject,
        message: body.message,
        fromUserId: req.user.sub,
        toUserId: body.toUserId,
        leaveFrom: body.leaveFrom ? new Date(body.leaveFrom) : undefined,
        leaveTo: body.leaveTo ? new Date(body.leaveTo) : undefined,
        leaveType: body.leaveType,
        rollNumbers: body.rollNumbers,
        correctionDate: body.correctionDate
          ? new Date(body.correctionDate)
          : undefined,
        periodNumbers: body.periodNumbers,
        newStatus: body.newStatus,
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  // ── Get my sent requests ──
  @Get('sent')
  @ApiOperation({ summary: 'Get requests I have sent' })
  async getSent(@Req() req: any) {
    return this.prisma.serviceRequest.findMany({
      where: { fromUserId: req.user.sub },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get requests sent to me (inbox) ──
  @Get('inbox')
  @ApiOperation({ summary: 'Get requests sent to me' })
  async getInbox(@Req() req: any) {
    return this.prisma.serviceRequest.findMany({
      where: { toUserId: req.user.sub },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get all requests (admin) ──
  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all requests (admin only)' })
  async getAll(@Query('type') type?: string, @Query('status') status?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    return this.prisma.serviceRequest.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Approve / Reject a request ──
  @Patch(':id/respond')
  @ApiOperation({ summary: 'Approve or reject a request' })
  async respond(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; adminRemarks?: string },
  ) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });
    if (!request) throw new Error('Request not found');

    // Verify the user is the recipient or admin
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (request.toUserId !== req.user.sub && user?.role !== 'ADMIN') {
      throw new Error('You can only respond to requests sent to you');
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminRemarks: body.adminRemarks,
        resolvedAt: new Date(),
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  // ── Get users I can send requests to ──
  @Get('recipients')
  @ApiOperation({ summary: 'Get list of users I can send requests to' })
  async getRecipients(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { student: true, faculty: true },
    });
    if (!user) throw new Error('User not found');

    const where: any = { isActive: true, id: { not: req.user.sub } };

    // Students → Faculty + HOD
    if (user.role === 'STUDENT') {
      where.role = { in: ['FACULTY', 'HOD'] };
    }
    // Faculty → HOD + ADMIN
    else if (user.role === 'FACULTY') {
      where.role = { in: ['HOD', 'ADMIN'] };
    }
    // HOD → ADMIN
    else if (user.role === 'HOD') {
      where.role = { in: ['ADMIN'] };
    }

    return this.prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }
}
