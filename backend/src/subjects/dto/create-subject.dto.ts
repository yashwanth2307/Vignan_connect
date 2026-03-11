import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
    @ApiProperty({ example: 'CS301' })
    @IsString() @IsNotEmpty()
    code: string;

    @ApiProperty({ example: 'Data Structures' })
    @IsString() @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 4 })
    @IsInt() @Min(1)
    credits: number;

    @ApiProperty({ example: 3 })
    @IsInt() @Min(1)
    semesterNumber: number;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    regulationId: string;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    departmentId: string;
}
