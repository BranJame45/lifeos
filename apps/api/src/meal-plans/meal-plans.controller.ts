import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MealPlansService } from './meal-plans.service';

@Controller('meal-plans')
@UseGuards(AuthGuard('jwt'))
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Get('current')
  getCurrent(@Req() req: any) {
    return this.mealPlansService.getCurrent(req.user.id);
  }

  @Get('preview')
  getPreview(@Req() req: any) {
    return this.mealPlansService.getPreview(req.user.id);
  }

  @Post('generate')
  generate(@Req() req: any, @Body() body: { weeks?: number }) {
    return this.mealPlansService.generate(req.user.id, body?.weeks === 2 ? 2 : 1);
  }

  @Post('confirm/:id')
  confirm(@Param('id') id: string) {
    return this.mealPlansService.confirm(id);
  }

  @Patch('meal/:id')
  toggleMeal(@Param('id') id: string) {
    return this.mealPlansService.toggleMeal(id);
  }
}
