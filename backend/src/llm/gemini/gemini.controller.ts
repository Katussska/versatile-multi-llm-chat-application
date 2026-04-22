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
import { LimitGuard } from '../limit.guard';

@Controller('gemini')
@UseGuards(AuthGuard, LimitGuard)
export class GeminiController {
  constructor(private readonly service: GeminiService) {}

  @Post('')
  getResponse(@Body() data: GetAIMessageDTO) {
    return this.service.generateText(data);
  }
}
