import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, ValidateIf } from 'class-validator';

export class SetLimitDto {
  @ApiProperty({ nullable: true })
  @ValidateIf((o: SetLimitDto) => o.limit !== null)
  @IsNumber()
  @Min(0)
  limit: number | null;
}
