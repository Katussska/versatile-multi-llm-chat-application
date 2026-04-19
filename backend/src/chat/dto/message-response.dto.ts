import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chatId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  path!: string;

  @ApiProperty()
  favourite!: boolean;

  @ApiPropertyOptional({ nullable: true })
  parentMessageId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
