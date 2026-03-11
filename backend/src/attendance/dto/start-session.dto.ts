import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
    @ApiProperty()
    @IsString() @IsNotEmpty()
    courseOfferingId: string;

    @ApiProperty({ example: 1 })
    @IsInt() @Min(1) @Max(10)
    hourIndex: number;
}
