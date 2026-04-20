import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsUUID, Min } from 'class-validator';

export class CreateTokenDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  modelId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  tokenCount: number;

  @ApiProperty()
  @IsDateString()
  resetAt: string;
}
