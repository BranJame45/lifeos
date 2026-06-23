import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MealPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const now = new Date();
    const plan = await this.prisma.mealPlan.findFirst({
      where: {
        userId,
        weekStart: { lte: now },
        weekEnd: { gte: now },
        confirmed: true,
      },
      include: { meals: true },
      orderBy: { createdAt: 'desc' },
    });
    return plan;
  }

  async generate(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const plan = await this.prisma.mealPlan.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        confirmed: false,
      },
      include: { meals: true },
    });

    return { previewId: plan.id, plan, message: 'Review and confirm the plan' };
  }

  async confirm(id: string) {
    const plan = await this.prisma.mealPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    return this.prisma.mealPlan.update({
      where: { id },
      data: { confirmed: true },
      include: { meals: true },
    });
  }

  async toggleMeal(id: string) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new NotFoundException('Meal not found');

    return this.prisma.meal.update({
      where: { id },
      data: { completed: !meal.completed },
    });
  }
}
