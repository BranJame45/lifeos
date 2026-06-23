import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeekly(userId: string, weekStart: Date) {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const [habits, meals, workoutSessions] = await Promise.all([
      this.prisma.habitLog.findMany({
        where: { userId, date: { gte: start, lte: end } },
      }),
      this.prisma.meal.findMany({
        where: { plan: { userId }, date: { gte: start, lte: end } },
      }),
      this.prisma.workoutSession.findMany({
        where: { plan: { userId }, date: { gte: start, lte: end } },
      }),
    ]);

    const totalHabits = habits.length;
    const completedHabits = habits.filter((h) => h.completed).length;
    const totalMeals = meals.length;
    const completedMeals = meals.filter((m) => m.completed).length;
    const totalWorkouts = workoutSessions.length;
    const completedWorkouts = workoutSessions.filter((w) => w.completed).length;

    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      dailyData.push({
        date: day.toISOString().split('T')[0],
        habits: habits.filter((h) => h.date.toDateString() === day.toDateString()).length,
        meals: meals.filter((m) => m.date.toDateString() === day.toDateString()).length,
        workouts: workoutSessions.filter((w) => w.date.toDateString() === day.toDateString()).length,
      });
    }

    return {
      weekStart: start.toISOString(),
      habits: { total: totalHabits, completed: completedHabits, percentage: totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0 },
      meals: { total: totalMeals, completed: completedMeals, percentage: totalMeals ? Math.round((completedMeals / totalMeals) * 100) : 0 },
      workouts: { total: totalWorkouts, completed: completedWorkouts, percentage: totalWorkouts ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0 },
      dailyData,
    };
  }

  async getComparison(userId: string, week1Start: Date, week2Start: Date) {
    const week1 = await this.getWeekly(userId, week1Start);
    const week2 = await this.getWeekly(userId, week2Start);
    return { week1, week2 };
  }
}
