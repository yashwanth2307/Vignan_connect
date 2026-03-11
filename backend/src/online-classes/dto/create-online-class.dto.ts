import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOnlineClassDto {
    @ApiProperty({ example: 'Data Structures - Linked Lists' })
    @IsString() @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Covering singly and doubly linked lists' })
    @IsString() @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: 'https://meet.google.com/abc-xyz-123' })
    @IsString() @IsOptional()
    meetingLink?: string;

    @ApiPropertyOptional({ example: 'In-App' })
    @IsString() @IsOptional()
    @IsIn(['In-App', 'Google Meet', 'Zoom', 'Microsoft Teams', 'Other'])
    platform?: string;

    @ApiPropertyOptional({ description: 'Course offering ID (links class to specific section + subject + faculty)' })
    @IsString() @IsOptional()
    courseOfferingId?: string;

    @ApiProperty({ example: '2026-03-03T10:00:00Z' })
    @IsString() @IsNotEmpty()
    scheduledAt: string;

    @ApiPropertyOptional({ example: 60 })
    @IsInt() @Min(5) @IsOptional()
    durationMinutes?: number;
}
