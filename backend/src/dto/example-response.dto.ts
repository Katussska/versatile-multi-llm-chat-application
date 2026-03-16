import { ApiProperty } from '@nestjs/swagger';

export class ExampleResponseDto {
  @ApiProperty({
    example: 'Ahoj Cognify',
    description: 'Stejna hodnota jako ve vstupnim DTO.',
  })
  echoedMessage!: string;

  @ApiProperty({
    example: 12,
    description: 'Delka textu ze vstupu.',
  })
  length!: number;
}
