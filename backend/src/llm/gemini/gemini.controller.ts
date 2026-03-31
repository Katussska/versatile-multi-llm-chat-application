import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly service: GeminiService) {}

  // TODO: remove AllowAnonymous implementation with FE
  @Post('')
  @AllowAnonymous()
  getResponse(@Body() data: GetAIMessageDTO) {
    return this.service.generateText(data);
  }
}
