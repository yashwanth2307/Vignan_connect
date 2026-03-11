import { IsString, IsEmail, IsNotEmpty, IsInt, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString() @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'john@vignan.edu' })
    @IsEmail() @IsNotEmpty()
    email: string;

    @ApiPropertyOptional({ example: 'student@22B01A0501', description: 'Defaults to student@{rollNo} if not provided' })
    @IsString() @IsOptional() @MinLength(6)
    password?: string;

    @ApiPropertyOptional({ example: '9876543210' })
    @IsString() @IsOptional()
    phone?: string;

    @ApiProperty({ example: '22B01A0501' })
    @IsString() @IsNotEmpty()
    rollNo: string;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    sectionId: string;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    departmentId: string;

    @ApiProperty()
    @IsString() @IsNotEmpty()
    regulationId: string;

    @ApiProperty({ example: 2022 })
    @IsInt()
    batchStartYear: number;

    @ApiProperty({ example: 2026 })
    @IsInt()
    batchEndYear: number;
}
