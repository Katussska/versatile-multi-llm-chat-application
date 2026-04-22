import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTokenDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  modelId: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  tokenCount?: number | null;
}
