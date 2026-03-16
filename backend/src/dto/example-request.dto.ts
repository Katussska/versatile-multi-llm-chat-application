import { ApiProperty } from '@nestjs/swagger';

export class ExampleRequestDto {
  @ApiProperty({
    example: 'Ahoj Cognify',
    description: 'Text, ktery se ma vratit zpet v odpovedi.',
  })
  message!: string;
}
