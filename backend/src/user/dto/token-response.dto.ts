import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true })
  dollarLimit: number | null;

  @ApiProperty()
  usedDollars: number;

  @ApiProperty()
  resetAt: Date;
}
