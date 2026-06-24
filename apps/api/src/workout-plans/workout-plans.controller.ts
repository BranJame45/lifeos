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

  @Get('preview')
  getPreview(@Req() req: any) {
    return this.workoutPlansService.getPreview(req.user.id);
  }

  @Post('generate')
  generate(
    @Req() req: any,
    @Body() body?: { days?: Array<{ day: string; minutes: number }> },
  ) {
    return this.workoutPlansService.generate(req.user.id, body);
  }

  @Post('confirm/:id')
  confirm(@Param('id') id: string) {
    return this.workoutPlansService.confirm(id);
  }

  @Patch('exercise/:id')
  toggleExercise(@Param('id') id: string) {
    return this.workoutPlansService.toggleExercise(id);
  }

  @Patch('exercise/:id/weight')
  setWeight(@Param('id') id: string, @Body() body: { weight: number | null }) {
    return this.workoutPlansService.setExerciseWeight(id, body?.weight ?? null);
  }

  @Patch('session/:id/notes')
  setNotes(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.workoutPlansService.setSessionNotes(id, body?.notes ?? '');
  }

  @Post('exercise/:id/substitute')
  substitute(@Param('id') id: string) {
    return this.workoutPlansService.suggestSubstitute(id);
  }
}
