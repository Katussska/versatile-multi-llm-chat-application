import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsUUID()
  modelId!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title: string = 'New Chat';
}
