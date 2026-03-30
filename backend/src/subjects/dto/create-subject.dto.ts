import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'CS301' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Data Structures' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  semesterNumber: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyHours?: number;

  @ApiPropertyOptional({
    example: 'THEORY',
    enum: ['THEORY', 'LAB', 'PROJECT', 'SEMINAR'],
  })
  @IsOptional()
  @IsString()
  subjectType?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isLab?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isElective?: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  regulationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
