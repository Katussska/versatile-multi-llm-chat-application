import { ApiProperty } from '@nestjs/swagger';

export class ModelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  displayLabel!: string;

  @ApiProperty()
  iconKey!: string;
}
