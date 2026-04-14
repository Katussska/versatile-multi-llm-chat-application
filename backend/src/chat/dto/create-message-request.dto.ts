import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMessageRequestDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;
}
