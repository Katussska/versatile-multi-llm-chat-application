import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsUUID()
  modelId!: string;

  @IsString()
  @IsNotEmpty()
  title: string = 'New Chat';
}
