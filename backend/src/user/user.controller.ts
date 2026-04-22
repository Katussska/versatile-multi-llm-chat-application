import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../admin/roles.guard';
import { User } from '../entities/User';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserBasicResponseDto, UserResponseDto } from './dto/user-response.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { TokenResponseDto, ModelDto } from './dto/token-response.dto';
import { SetLimitDto } from './dto/set-limit.dto';

function toUserResponse(
  user: User & {
    currentSpending?: number;
    tokenLimits?: {
      modelId?: string;
      modelName: string;
      provider: string;
      tokenCount: number | null;
      usedTokens: number;
    }[];
  },
): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    admin: user.admin,
    createdAt: user.createdAt,
    monthlyLimit: user.monthlyLimit ?? null,
    currentSpending: user.currentSpending ?? 0,
    tokenLimits: (user.tokenLimits ?? []).map(
      ({ modelName, provider, tokenCount, usedTokens }) => ({
        modelName,
        provider,
        tokenCount,
        usedTokens,
      }),
    ),
  };
}

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiOkResponse({ description: 'List of users', type: [UserResponseDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getUsers(): Promise<UserResponseDto[]> {
    const users = await this.userService.getUsers();
    return users.map(toUserResponse);
  }

  @Post()
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.createUser(dto);
    return toUserResponse(user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update user email or password (admin only)' })
  @ApiOkResponse({
    description: 'User successfully updated',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email already in use' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, dto);
    return toUserResponse(user);
  }

  @Patch(':id/limit')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Set monthly dollar limit for a user (admin only)' })
  @ApiOkResponse({ description: 'Limit updated', type: UserBasicResponseDto })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async setUserLimit(
    @Param('id') id: string,
    @Body() dto: SetLimitDto,
  ): Promise<UserBasicResponseDto> {
    const user = await this.userService.setUserLimit(id, dto);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      createdAt: user.createdAt,
      monthlyLimit: user.monthlyLimit,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiNoContentResponse({ description: 'User successfully deleted' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({
    description: 'Admin access required or self-deletion',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteUser(
    @Session() session: UserSession,
    @Param('id') id: string,
  ): Promise<void> {
    await this.userService.deleteUser(id, session.user.id);
  }

  @Get('models')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List available models (admin only)' })
  @ApiOkResponse({ description: 'List of models', type: [ModelDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getModels(): Promise<ModelDto[]> {
    const models = await this.userService.getModels();
    return models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
    }));
  }

  @Get('me/tokens')
  @ApiOperation({ summary: 'Get token limits for the current user' })
  @ApiOkResponse({ description: 'Token limits', type: [TokenResponseDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  async getMyTokens(
    @Session() session: UserSession,
  ): Promise<TokenResponseDto[]> {
    return this.userService.getTokens(session.user.id);
  }

  @Get(':id/tokens')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get token limits for a user (admin only)' })
  @ApiOkResponse({ description: 'Token limits', type: [TokenResponseDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getTokens(@Param('id') id: string): Promise<TokenResponseDto[]> {
    return this.userService.getTokens(id);
  }

  @Post(':id/tokens')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create token limit for a user (admin only)' })
  @ApiCreatedResponse({
    description: 'Token limit created',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'User or model not found' })
  @ApiConflictResponse({
    description: 'Token limit for this model already exists',
  })
  async createToken(
    @Param('id') id: string,
    @Body() dto: CreateTokenDto,
  ): Promise<TokenResponseDto> {
    return this.userService.createToken(id, dto);
  }

  @Patch(':id/tokens/:tokenId')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update token limit for a user (admin only)' })
  @ApiOkResponse({ description: 'Token limit updated', type: TokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Token limit not found' })
  async updateToken(
    @Param('id') id: string,
    @Param('tokenId') tokenId: string,
    @Body() dto: UpdateTokenDto,
  ): Promise<TokenResponseDto> {
    return this.userService.updateToken(id, tokenId, dto);
  }

  @Delete(':id/tokens/:tokenId')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete token limit for a user (admin only)' })
  @ApiNoContentResponse({ description: 'Token limit deleted' })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Token limit not found' })
  async deleteToken(
    @Param('id') id: string,
    @Param('tokenId') tokenId: string,
  ): Promise<void> {
    await this.userService.deleteToken(id, tokenId);
  }
}
