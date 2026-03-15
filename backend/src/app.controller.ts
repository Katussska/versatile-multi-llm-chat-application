import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProduces } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiProduces('text/plain')
  @ApiOkResponse({
    description: 'Successful response',
    content: {
      'text/plain': {
        schema: { type: 'string' },
      },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
