import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GetAIMessageDTO } from './model/get_ai_response.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly service: GeminiService) {}

  @Post('')
  //   @UsePipes(new ValidationPipe({ transform: true }))
  @AllowAnonymous()
  getResponse(@Body() data: GetAIMessageDTO) {
    console.log('BODY:', data, 'TYPE:', typeof data);
    return this.service.generateText(data);
  }
}
