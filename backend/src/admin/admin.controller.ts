import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from './roles.guard';
import { AdminService } from './admin.service';
import { AdminUserDto } from './dto/admin-user.dto';
import { UpdateLimitDto } from './dto/update-limit.dto';
import { StatsResponseDto } from '../user/dto/stats-response.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users with limits and spend' })
  @ApiOkResponse({ description: 'List of users', type: [AdminUserDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getUsers(): Promise<AdminUserDto[]> {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/limit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: "Update a user's monthly dollar limit" })
  @ApiOkResponse({ description: 'Updated user', type: AdminUserDto })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateLimit(
    @Param('id') id: string,
    @Body() dto: UpdateLimitDto,
  ): Promise<AdminUserDto> {
    return this.adminService.updateLimit(id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Activity statistics for the given period' })
  @ApiOkResponse({ description: 'Admin statistics', type: StatsResponseDto })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getStats(@Query('days') daysParam?: string): Promise<StatsResponseDto> {
    const days = [1, 7, 14, 30].includes(Number(daysParam))
      ? Number(daysParam)
      : 30;
    return this.adminService.getStats(days);
  }
}
