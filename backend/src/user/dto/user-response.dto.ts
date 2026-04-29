import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/UserRole';

export class BudgetDto {
  @ApiProperty({ nullable: true })
  dollarLimit!: number | null;

  @ApiProperty()
  usedDollars!: number;
}

export class UserBasicResponseDto {
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
}

export class UserResponseDto extends UserBasicResponseDto {
  @ApiProperty({ type: BudgetDto, nullable: true })
  budget!: BudgetDto | null;
}
