import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { ModelService } from './model.service';
import { ModelResponseDto } from './dto/model-response.dto';

@Controller('models')
@UseGuards(AuthGuard)
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available models' })
  @ApiOkResponse({
    description: 'List of models sorted by creation date',
    type: [ModelResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  async getModels(): Promise<ModelResponseDto[]> {
    const models = await this.modelService.getEnabledModels();
    return models.map((model) => ({
      id: model.id,
      provider: model.provider,
      name: model.name,
      displayLabel: model.displayLabel,
      iconKey: model.iconKey,
    }));
  }
}
