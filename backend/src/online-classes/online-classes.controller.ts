import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OnlineClassesService } from './online-classes.service';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Online Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('online-classes')
export class OnlineClassesController {
  constructor(private service: OnlineClassesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Schedule an online class for your section' })
  create(@Body() dto: CreateOnlineClassDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all online classes' })
  findAll() {
    return this.service.findAll();
  }

  @Get('my')
  @ApiOperation({
    summary:
      'Get my online classes (faculty: my offerings, student: my section)',
  })
  findMy(@Request() req: any) {
    if (req.user.role === 'STUDENT') {
      return this.service.findForStudent(req.user.sub);
    }
    return this.service.findForFaculty(req.user.sub);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'List upcoming online classes' })
  findUpcoming() {
    return this.service.findUpcoming();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get online class by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Update online class' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateOnlineClassDto> & { status?: string },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Delete online class' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
