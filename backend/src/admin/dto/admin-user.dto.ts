import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/UserRole';

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

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: [TokenLimitDto] })
  tokenLimits!: TokenLimitDto[];
}
