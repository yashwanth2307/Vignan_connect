import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseOfferingDto {
    @ApiProperty()
    @IsString() @IsNotEmpty()
    subjectId: string;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    sectionId: string;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    facultyId: string;

    @ApiPropertyOptional({ description: 'Auto-resolved from subject if not provided' })
    @IsString() @IsOptional()
    semesterId?: string;
}
