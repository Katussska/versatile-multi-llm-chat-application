import { ApiProperty } from '@nestjs/swagger';

export class DailyStatDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  messages!: number;
}

export class StatsResponseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty({ nullable: true })
  mostUsedModel!: string | null;

  @ApiProperty({ type: [DailyStatDto] })
  dailyActivity!: DailyStatDto[];
}
