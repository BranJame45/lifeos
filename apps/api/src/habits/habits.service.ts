import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getToday(userId: string) {
    const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habits = await this.prisma.habit.findMany({
      where: {
        userId,
        active: true,
        OR: [
          { frequency: { has: 'daily' } },
          { frequency: { has: dayName } },
        ],
      },
    });

    const logs = await this.prisma.habitLog.findMany({
      where: { userId, date: today },
    });

    const loggedIds = new Set(logs.map((l) => l.habitId));
    return habits.map((h) => ({
      ...h,
      completed: loggedIds.has(h.id),
    }));
  }

  async create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, dto: UpdateHabitDto) {
    await this.findById(id);
    return this.prisma.habit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.habit.delete({ where: { id } });
  }

  async log(userId: string, habitId: string) {
    const habit = await this.findById(habitId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.habitLog.findUnique({
      where: { habitId_userId_date: { habitId, userId, date: today } },
    });

    if (existing) {
      await this.prisma.habitLog.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.habitLog.create({
        data: { habitId, userId, date: today, completed: true },
      });
    }

    const streak = await this.updateStreak(habitId);
    return { streak };
  }

  private async updateStreak(habitId: string): Promise<number> {
    const logs = await this.prisma.habitLog.findMany({
      where: { habitId, completed: true },
      orderBy: { date: 'desc' },
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      expected.setHours(0, 0, 0, 0);

      const logDate = new Date(logs[i].date);
      logDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    await this.prisma.habit.update({
      where: { id: habitId },
      data: { streak },
    });

    return streak;
  }

  private async findById(id: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id } });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }
}
