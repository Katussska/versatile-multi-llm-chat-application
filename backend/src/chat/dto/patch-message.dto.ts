import { IsNotEmpty, IsString } from 'class-validator';

export class PatchMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
