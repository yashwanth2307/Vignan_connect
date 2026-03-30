import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsInt()
  bucket: number;

  @ApiPropertyOptional({
    description: 'Base64-encoded selfie for face verification',
  })
  @IsString()
  @IsOptional()
  selfieData?: string;
}
