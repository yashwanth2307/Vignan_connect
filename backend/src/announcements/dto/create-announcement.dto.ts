import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
    @ApiProperty({ example: 'Mid Semester Exams Schedule' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Mid semester exams will start from March 15th...' })
    @IsString()
    message: string;

    @ApiPropertyOptional({ example: 'STUDENT', description: 'Target role (null for all)' })
    @IsOptional()
    @IsString()
    targetRole?: string;

    @ApiPropertyOptional({ description: 'Target department ID' })
    @IsOptional()
    @IsString()
    departmentId?: string;
}
