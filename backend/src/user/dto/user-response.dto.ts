import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenLimitDto {
  @ApiProperty()
  modelName!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty({ nullable: true })
  tokenCount!: number | null;

  @ApiProperty()
  usedTokens!: number;
}

export class UserBasicResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  admin!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  monthlyLimit!: number | null;
}

export class UserResponseDto extends UserBasicResponseDto {
  @ApiProperty()
  currentSpending!: number;

  @ApiProperty({ type: [TokenLimitDto] })
  tokenLimits!: TokenLimitDto[];
}
