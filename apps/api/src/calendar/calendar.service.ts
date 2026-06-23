import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getDayView(userId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [meals, workoutSessions, habits] = await Promise.all([
      this.prisma.meal.findMany({
        where: { plan: { userId }, date: { gte: dayStart, lte: dayEnd } },
        include: { plan: true },
      }),
      this.prisma.workoutSession.findMany({
        where: { plan: { userId }, date: { gte: dayStart, lte: dayEnd } },
        include: { exercises: true },
      }),
      this.prisma.habitLog.findMany({
        where: { userId, date: { gte: dayStart, lte: dayEnd }, completed: true },
        include: { habit: true },
      }),
    ]);

    return { date: date.toISOString(), meals, workoutSessions, habits };
  }

  async getWeekView(userId: string, from: Date) {
    const weekStart = new Date(from);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dayView = await this.getDayView(userId, day);
      days.push(dayView);
    }

    return { weekStart: weekStart.toISOString(), days };
  }

  async getMonthView(userId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const completedLogs = await this.prisma.habitLog.findMany({
      where: { userId, date: { gte: start, lte: end }, completed: true },
    });
    const completedWorkouts = await this.prisma.workoutSession.findMany({
      where: { plan: { userId }, date: { gte: start, lte: end }, completed: true },
    });
    const completedMeals = await this.prisma.meal.findMany({
      where: { plan: { userId }, date: { gte: start, lte: end }, completed: true },
    });

    const days: Record<string, { habits: number; workouts: number; meals: number }> = {};

    for (const log of completedLogs) {
      const key = log.date.toISOString().split('T')[0];
      if (!days[key]) days[key] = { habits: 0, workouts: 0, meals: 0 };
      days[key].habits++;
    }
    for (const ws of completedWorkouts) {
      const key = ws.date.toISOString().split('T')[0];
      if (!days[key]) days[key] = { habits: 0, workouts: 0, meals: 0 };
      days[key].workouts++;
    }
    for (const meal of completedMeals) {
      const key = meal.date.toISOString().split('T')[0];
      if (!days[key]) days[key] = { habits: 0, workouts: 0, meals: 0 };
      days[key].meals++;
    }

    return { month, year, days };
  }
}
