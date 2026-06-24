import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(AuthGuard('jwt'))
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  private parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  @Get('day')
  getDay(@Req() req: any, @Query('date') date: string) {
    return this.calendarService.getDayView(req.user.id, this.parseLocalDate(date));
  }

  @Get('week')
  getWeek(@Req() req: any, @Query('from') from: string) {
    return this.calendarService.getWeekView(req.user.id, this.parseLocalDate(from));
  }

  @Get('month')
  getMonth(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
    return this.calendarService.getMonthView(req.user.id, parseInt(month), parseInt(year));
  }
}
