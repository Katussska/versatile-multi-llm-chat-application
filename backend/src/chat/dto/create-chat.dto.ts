import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @ApiProperty({ required: false, default: 'New Chat' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title: string = 'New Chat';
}
