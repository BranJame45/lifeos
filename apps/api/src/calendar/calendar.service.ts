import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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
        orderBy: { type: 'asc' },
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

    return { date: dayStart.toISOString(), meals, workoutSessions, habits };
  }

  async getWeekView(userId: string, from: Date) {
    const weekStart = new Date(from);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Los 7 días son independientes: se resuelven en paralelo (antes era un
    // N+1 de 21 queries en serie -> ahora todas concurrentes).
    const days = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        return this.getDayView(userId, day);
      }),
    );

    return { weekStart: weekStart.toISOString(), days };
  }

  async getMonthView(userId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);
    const daysInMonth = end.getDate();

    const [habitDefs, completedLogs, sessions, meals] = await Promise.all([
      this.prisma.habit.findMany({
        where: { userId, active: true },
        select: { frequency: true },
      }),
      this.prisma.habitLog.findMany({
        where: { userId, date: { gte: start, lte: end }, completed: true },
      }),
      this.prisma.workoutSession.findMany({
        where: { plan: { userId }, date: { gte: start, lte: end } },
      }),
      this.prisma.meal.findMany({
        where: { plan: { userId }, date: { gte: start, lte: end } },
      }),
    ]);

    type DayBucket = { habits: number; workouts: number; meals: number; completed: number; planned: number };
    const days: Record<string, DayBucket> = {};
    const ensure = (key: string): DayBucket => {
      if (!days[key]) days[key] = { habits: 0, workouts: 0, meals: 0, completed: 0, planned: 0 };
      return days[key];
    };

    // Planificado de hábitos: para cada día del mes, cuántos hábitos están agendados
    // (frecuencia "daily" o el día de la semana correspondiente).
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const wd = WEEKDAY_KEYS[date.getDay()];
      const plannedHabits = habitDefs.filter(
        (h) => h.frequency.includes('daily') || h.frequency.includes(wd),
      ).length;
      if (plannedHabits > 0) ensure(key).planned += plannedHabits;
    }

    // Hábitos completados
    for (const log of completedLogs) {
      const key = log.date.toISOString().split('T')[0];
      const b = ensure(key);
      b.habits++;
      b.completed++;
    }

    // Entrenamientos: cada sesión es "planificado"; suma a completado si está hecha
    for (const ws of sessions) {
      const key = ws.date.toISOString().split('T')[0];
      const b = ensure(key);
      b.planned++;
      if (ws.completed) {
        b.workouts++;
        b.completed++;
      }
    }

    // Comidas: cada comida es "planificada"; suma a completado si está marcada
    for (const meal of meals) {
      const key = meal.date.toISOString().split('T')[0];
      const b = ensure(key);
      b.planned++;
      if (meal.completed) {
        b.meals++;
        b.completed++;
      }
    }

    return { month, year, days };
  }
}
