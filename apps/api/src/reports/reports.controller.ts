import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  getWeekly(@Req() req: any, @Query('weekStart') weekStart: string) {
    return this.reportsService.getWeekly(req.user.id, new Date(weekStart));
  }

  @Get('comparison')
  getComparison(
    @Req() req: any,
    @Query('week1') week1: string,
    @Query('week2') week2: string,
  ) {
    return this.reportsService.getComparison(req.user.id, new Date(week1), new Date(week2));
  }

  @Get('summary')
  getSummary(
    @Req() req: any,
    @Query('weekStart') weekStart: string,
    @Query('locale') locale: string,
  ) {
    return this.reportsService.getSummary(req.user.id, new Date(weekStart), locale || 'es');
  }
}
