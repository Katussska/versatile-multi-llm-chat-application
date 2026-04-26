import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@Controller('gemini')
@UseGuards(AuthGuard)
export class GeminiController {
  constructor(private readonly service: GeminiService) {}

  @Post('')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  getResponse(@Body() data: GetAIMessageDTO) {
    return this.service.generateText(data);
  }
}
