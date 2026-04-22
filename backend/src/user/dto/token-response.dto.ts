import { ApiProperty } from '@nestjs/swagger';

export class ModelDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;
}

export class TokenResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: ModelDto })
  model: ModelDto;

  @ApiProperty({ nullable: true })
  tokenCount: number | null;

  @ApiProperty()
  usedTokens: number;

  @ApiProperty()
  resetAt: Date;
}
