import { ApiProperty } from '@nestjs/swagger';

export class ChartDataPointDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  modelName!: string;

  @ApiProperty()
  modelProvider!: string;

  @ApiProperty()
  tokensIn!: number;

  @ApiProperty()
  tokensOut!: number;

  @ApiProperty()
  tokensCached!: number;

  @ApiProperty()
  cost!: number;
}
