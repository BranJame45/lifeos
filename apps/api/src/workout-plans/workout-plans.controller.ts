import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkoutPlansService } from './workout-plans.service';

@Controller('workout-plans')
@UseGuards(AuthGuard('jwt'))
export class WorkoutPlansController {
  constructor(private readonly workoutPlansService: WorkoutPlansService) {}

  @Get('current')
  getCurrent(@Req() req: any) {
    return this.workoutPlansService.getCurrent(req.user.id);
  }

  @Post('generate')
  generate(@Req() req: any) {
    return this.workoutPlansService.generate(req.user.id);
  }

  @Post('confirm/:id')
  confirm(@Param('id') id: string) {
    return this.workoutPlansService.confirm(id);
  }

  @Patch('exercise/:id')
  toggleExercise(@Param('id') id: string) {
    return this.workoutPlansService.toggleExercise(id);
  }

  @Post('exercise/:id/substitute')
  substitute(@Param('id') id: string) {
    return this.workoutPlansService.suggestSubstitute(id);
  }
}
