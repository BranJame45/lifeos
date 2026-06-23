import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Controller('habits')
@UseGuards(AuthGuard('jwt'))
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.habitsService.findAll(req.user.id);
  }

  @Get('today')
  getToday(@Req() req: any) {
    return this.habitsService.getToday(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(req.user.id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHabitDto) {
    return this.habitsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.habitsService.remove(id);
  }

  @Post(':id/log')
  log(@Req() req: any, @Param('id') id: string) {
    return this.habitsService.log(req.user.id, id);
  }
}
