import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @ApiProperty({ example: 'Computer Science and Engineering' })
    @IsString() @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'CSE' })
    @IsString() @IsNotEmpty()
    code: string;
}
