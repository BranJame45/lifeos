import { Module } from '@nestjs/common';
import { WorkoutPlansController } from './workout-plans.controller';
import { WorkoutPlansService } from './workout-plans.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService, PrismaService],
})
export class WorkoutPlansModule {}
