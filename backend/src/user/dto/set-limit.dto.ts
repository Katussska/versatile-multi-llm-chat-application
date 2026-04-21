import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, ValidateIf } from 'class-validator';

export class SetLimitDto {
  @ApiProperty({ nullable: true })
  @ValidateIf((o) => o.limit !== null)
  @IsInt()
  @Min(1)
  limit: number | null;
}
