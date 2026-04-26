import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/UserRole';

export class BudgetLimitDto {
  @ApiProperty()
  modelName!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty({ nullable: true })
  dollarLimit!: number | null;

  @ApiProperty()
  usedDollars!: number;
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

  @ApiProperty({ type: [BudgetLimitDto] })
  budgetLimits!: BudgetLimitDto[];
}
