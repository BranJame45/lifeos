import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkoutPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const now = new Date();
    return this.prisma.workoutPlan.findFirst({
      where: {
        userId,
        weekStart: { lte: now },
        weekEnd: { gte: now },
        confirmed: true,
      },
      include: { sessions: { include: { exercises: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generate(userId: string) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const plan = await this.prisma.workoutPlan.create({
      data: { userId, weekStart, weekEnd, confirmed: false },
      include: { sessions: { include: { exercises: true } } },
    });

    return { previewId: plan.id, plan, message: 'Review and confirm the plan' };
  }

  async confirm(id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.workoutPlan.update({
      where: { id },
      data: { confirmed: true },
      include: { sessions: { include: { exercises: true } } },
    });
  }

  async toggleExercise(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return this.prisma.exercise.update({
      where: { id },
      data: { completed: !exercise.completed },
    });
  }

  async suggestSubstitute(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return { original: exercise.name, suggestion: 'Consult the AI chat for a substitute' };
  }
}
