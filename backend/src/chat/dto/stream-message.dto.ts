import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StreamMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentMessageId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  regenerate?: boolean;
}
