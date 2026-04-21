import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenLimitDto {
  @ApiProperty()
  modelName: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  tokenCount: number;

  @ApiProperty()
  usedTokens: number;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  admin: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  monthlyLimit: number | null;

  @ApiProperty()
  currentSpending: number;

  @ApiProperty({ type: [TokenLimitDto] })
  tokenLimits: TokenLimitDto[];
}
