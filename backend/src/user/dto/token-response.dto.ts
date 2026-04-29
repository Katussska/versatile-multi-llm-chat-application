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
  dollarLimit: number | null;

  @ApiProperty()
  usedDollars: number;

  @ApiProperty()
  resetAt: Date;
}
