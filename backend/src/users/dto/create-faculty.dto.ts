import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateFacultyDto {
  @ApiProperty({ example: 'Dr. Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'smith@vignan.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'faculty@FAC001',
    description: 'Defaults to faculty@{empId} if not provided',
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'FAC001' })
  @IsString()
  @IsNotEmpty()
  empId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: '2020-06-15' })
  @IsString()
  @IsNotEmpty()
  dateOfJoin: string;

  @ApiPropertyOptional({
    enum: [UserRole.FACULTY, UserRole.HOD, UserRole.EXAM_CELL],
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
