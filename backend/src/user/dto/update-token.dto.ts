import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTokenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tokenCount?: number;
}
