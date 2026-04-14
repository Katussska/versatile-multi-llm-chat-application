import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class MessageCreateDto {
  @IsNotEmpty()
  @IsUUID()
  chatId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  path: string = '';
}
