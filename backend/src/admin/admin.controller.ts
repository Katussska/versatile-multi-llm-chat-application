import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from './roles.guard';
import { AdminService } from './admin.service';
import { AdminUserDto } from './dto/admin-user.dto';
import { StatsResponseDto } from '../user/dto/stats-response.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'List of users', type: [AdminUserDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getUsers(): Promise<AdminUserDto[]> {
    return this.adminService.getUsers();
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
