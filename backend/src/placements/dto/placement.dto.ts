import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlacementDriveDto {
  @ApiProperty({ example: 'TCS' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ example: 'Full-time opportunity for freshers...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 6.5 })
  @IsNumber()
  @Min(0)
  packageLPA: number;

  @ApiProperty({ example: 'CSE,ECE,IT' })
  @IsString()
  eligibleBranches: string;

  @ApiPropertyOptional({ example: 7.0 })
  @IsOptional()
  @IsNumber()
  minCGPA?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  maxBacklogs?: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  driveDate: string;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({ example: 'Campus - Main Auditorium' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class ApplyPlacementDto {
  @ApiPropertyOptional({ example: 'https://link-to-resume.pdf' })
  @IsOptional()
  @IsString()
  resume?: string;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({
    example: 'SHORTLISTED',
    description: 'APPLIED, SHORTLISTED, SELECTED, REJECTED',
  })
  @IsString()
  status: string;
}
