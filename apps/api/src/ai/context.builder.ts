import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContextBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async buildUserContext(userId: string): Promise<string> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [user, activeMealPlan, activeWorkoutPlan, habits, recentLogs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true, age: true, weight: true, height: true,
          goal: true, activityLevel: true, restrictions: true,
          mealPreferences: true, trainingDays: true, trainingType: true,
        },
      }),
      this.prisma.mealPlan.findFirst({
        where: { userId, weekStart: { lte: now }, weekEnd: { gte: now }, confirmed: true },
        take: 1,
      }),
      this.prisma.workoutPlan.findFirst({
        where: { userId, weekStart: { lte: now }, weekEnd: { gte: now }, confirmed: true },
        include: { sessions: true },
        take: 1,
      }),
      this.prisma.habit.findMany({
        where: { userId, active: true },
        select: { name: true, streak: true, category: true },
      }),
      this.prisma.habitLog.findMany({
        where: { userId, date: { gte: twoWeeksAgo }, completed: true },
      }),
    ]);

    const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const dayName = dayNames[now.getDay()];

    return `
- Perfil: ${user?.name || 'N/A'}, ${user?.age || '?'} años, ${user?.weight || '?'}kg, ${user?.height || '?'}cm
- Objetivo: ${user?.goal === 'VOLUME' ? 'Volumen' : user?.goal === 'DEFICIT' ? 'Déficit calórico' : 'No definido'}
- Nivel de actividad: ${user?.activityLevel || 'No definido'}
- Restricciones: ${user?.restrictions?.join(', ') || 'Ninguna'}
- Preferencias de comidas: ${user?.mealPreferences?.join(', ') || 'No configurado'}
- Días de entrenamiento: ${user?.trainingDays?.join(', ') || 'No configurado'}
- Tipo de entrenamiento: ${user?.trainingType || 'No configurado'}
- Día actual: ${dayName}
- Plan de comidas activo: ${activeMealPlan ? 'Sí' : 'No'}
- Plan de ejercicio activo: ${activeWorkoutPlan ? `Sí (${activeWorkoutPlan.sessions.length} sesiones)` : 'No'}
- Hábitos (${habits.length}): ${habits.map((h) => `${h.name} (racha: ${h.streak} días)`).join(', ')}
- Cumplimiento últimas 2 semanas: ${recentLogs.length} hábitos completados
`.trim();
  }
}
