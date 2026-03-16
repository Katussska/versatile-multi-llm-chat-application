import { ApiProperty } from '@nestjs/swagger';

export class ExampleGetResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Simple health-like status value.',
  })
  status!: string;

  @ApiProperty({
    example: 'Example GET endpoint is working.',
    description: 'Human-readable info message.',
  })
  message!: string;
}
