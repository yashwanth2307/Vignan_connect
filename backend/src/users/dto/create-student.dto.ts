import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MinLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'Ravi Kumar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ravi@vignan.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Defaults to student@{rollNo} if not provided',
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: '22CSE001' })
  @IsString()
  @IsNotEmpty()
  rollNo: string;

  // ── Student own phone ──
  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  studentPhone?: string;

  // ── Personal Details ──
  @ApiPropertyOptional({ example: '2004-06-15' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ enum: ['Male', 'Female', 'Other'] })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'O+' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsString()
  @IsOptional()
  aadharNumber?: string;

  @ApiPropertyOptional({ enum: ['REGULAR', 'LATERAL'], default: 'REGULAR' })
  @IsString()
  @IsOptional()
  admissionType?: string;

  @ApiPropertyOptional({ example: 'OC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  religion?: string;

  @ApiPropertyOptional({ default: 'Indian' })
  @IsString()
  @IsOptional()
  nationality?: string;

  // ── Father Details ──
  @ApiPropertyOptional({ example: 'Suresh Kumar' })
  @IsString()
  @IsOptional()
  fatherName?: string;

  @ApiPropertyOptional({ example: '9876543211' })
  @IsString()
  @IsOptional()
  fatherPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fatherOccupation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fatherEmail?: string;

  // ── Mother Details ──
  @ApiPropertyOptional({ example: 'Sunitha' })
  @IsString()
  @IsOptional()
  motherName?: string;

  @ApiPropertyOptional({ example: '9876543212' })
  @IsString()
  @IsOptional()
  motherPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  motherOccupation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  motherEmail?: string;

  // ── Guardian ──
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guardianName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guardianPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guardianRelation?: string;

  // ── Address ──
  @ApiPropertyOptional({ example: 'H.No 1-2-3 Main Road' })
  @IsString()
  @IsOptional()
  presentAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  permanentAddress?: string;

  @ApiPropertyOptional({ example: 'Guntur' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Andhra Pradesh' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '522001' })
  @IsString()
  @IsOptional()
  pincode?: string;

  // ── Academic Links ──
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  regulationId: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  batchStartYear: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  batchEndYear: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  currentYear?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  currentSemester?: number;
}
