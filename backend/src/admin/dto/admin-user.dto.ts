import { ApiProperty } from '@nestjs/swagger';

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

export class AdminUserDto {
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

  @ApiProperty({ nullable: true })
  monthlyLimit!: number | null;

  @ApiProperty()
  currentSpending!: number;

  @ApiProperty({ type: [TokenLimitDto] })
  tokenLimits!: TokenLimitDto[];
}
