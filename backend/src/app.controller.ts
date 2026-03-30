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

  // @Get('examples/db-probe')
  // @AllowAnonymous()
  // @ApiOperation({ summary: 'Public endpoint that performs a MikroORM DB read' })
  // @ApiOkResponse({
  //   description: 'Database read succeeded',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       ok: { type: 'boolean', example: true },
  //       usersCount: { type: 'number', example: 1 },
  //       sampleUser: {
  //         nullable: true,
  //         oneOf: [
  //           {
  //             type: 'object',
  //             properties: {
  //               id: {
  //                 type: 'string',
  //                 example: '4f6d8e7c-6f38-4d2e-a6d1-f4fd88f2d090',
  //               },
  //               email: { type: 'string', example: 'user@example.com' },
  //               createdAt: {
  //                 type: 'string',
  //                 format: 'date-time',
  //                 example: '2026-03-30T12:00:00.000Z',
  //               },
  //             },
  //           },
  //           { type: 'null' },
  //         ],
  //       },
  //       checkedAt: {
  //         type: 'string',
  //         format: 'date-time',
  //         example: '2026-03-30T12:00:00.000Z',
  //       },
  //     },
  //   },
  // })
  // @ApiInternalServerErrorResponse({
  //   description: 'MikroORM query failed (DB unavailable or misconfigured)',
  // })
  // // async getDbProbe() {
  // //   return this.appService.getDbProbe();
  // // }
  // @Get('examples/me')
  // @UseGuards(AuthGuard)
  // @ApiOperation({ summary: 'Guarded endpoint returning current user basics' })
  // @ApiOkResponse({
  //   description: 'Authenticated user and session payload',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       authenticated: { type: 'boolean', example: true },
  //       user: {
  //         type: 'object',
  //         properties: {
  //           id: {
  //             type: 'string',
  //             example: '4f6d8e7c-6f38-4d2e-a6d1-f4fd88f2d090',
  //           },
  //           email: { type: 'string', example: 'user@example.com' },
  //           name: { type: 'string', nullable: true, example: 'Jane Doe' },
  //         },
  //       },
  //       session: {
  //         type: 'object',
  //         properties: {
  //           id: {
  //             type: 'string',
  //             example: 'c73db30f-7e0a-4705-b8f7-87aa42c51ba1',
  //           },
  //           expiresAt: {
  //             type: 'string',
  //             format: 'date-time',
  //             example: '2026-03-30T12:00:00.000Z',
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // @ApiUnauthorizedResponse({ description: 'Missing or invalid auth session' })
  // getCurrentUser(@Session() session: UserSession) {
  //   return {
  //     authenticated: true,
  //     user: {
  //       id: session.user.id,
  //       email: session.user.email,
  //       name: session.user.name ?? null,
  //     },
  //     session: {
  //       id: session.session.id,
  //       expiresAt: session.session.expiresAt,
  //     },
  //   };
  // }
}
