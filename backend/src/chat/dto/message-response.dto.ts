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

  @ApiPropertyOptional({ nullable: true })
  parentMessageId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  modelKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  modelProvider!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
