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
import { ChartDataPointDto } from './dto/chart-data.dto';
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

  @Get('chart-data')
  @ApiOperation({ summary: 'Aggregated usage_log data for charts' })
  @ApiOkResponse({ description: 'Chart data points', type: [ChartDataPointDto] })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getChartData(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('provider') provider?: string,
    @Query('model') model?: string,
    @Query('userId') userId?: string,
  ): Promise<ChartDataPointDto[]> {
    return this.adminService.getChartData(from, to, provider, model, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Activity statistics for the given period' })
  @ApiOkResponse({ description: 'Admin statistics', type: StatsResponseDto })
  @ApiUnauthorizedResponse({ description: 'User not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<StatsResponseDto> {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
    return this.adminService.getStats(from ?? thirtyDaysAgo, to ?? today);
  }
}
