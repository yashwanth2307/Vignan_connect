import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegulationDto {
  @ApiProperty({ example: 'R22' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: { minAttendance: 75, passMark: 40 } })
  @IsObject()
  @IsOptional()
  rulesJson?: any;

  @ApiProperty({ example: '2022-06-01' })
  @IsString()
  @IsNotEmpty()
  activeFrom: string;

  @ApiPropertyOptional({ example: 'https://vignan.edu/r22.pdf' })
  @IsString()
  @IsOptional()
  pdfUrl?: string;
}
