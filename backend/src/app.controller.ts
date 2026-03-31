import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiOkResponse,
  ApiProduces,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AllowAnonymous,
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';
import { ExampleGetResponseDto } from './dto/example-get-response.dto';
import { ExampleRequestDto } from './dto/example-request.dto';
import { ExampleResponseDto } from './dto/example-response.dto';

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

  @Get('examples/status')
  @ApiOperation({ summary: 'Example GET endpoint with DTO response' })
  @ApiOkResponse({
    description: 'Simple status payload for OpenAPI/Swagger demo',
    type: ExampleGetResponseDto,
  })
  getExampleStatus(): ExampleGetResponseDto {
    return {
      status: 'ok',
      message: 'Example GET endpoint is working.',
    };
  }

  @Post('examples/echo')
  @ApiOperation({ summary: 'Example POST endpoint with DTO request/response' })
  @ApiCreatedResponse({
    description: 'Echoed payload for OpenAPI/Swagger demo',
    type: ExampleResponseDto,
  })
  createExample(@Body() body: ExampleRequestDto): ExampleResponseDto {
    return {
      echoedMessage: body.message,
      length: body.message.length,
    };
  }
}
