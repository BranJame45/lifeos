import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return '';
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeekly(userId: string, weekStart: Date) {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const [habits, meals, workoutSessions, habitList] = await Promise.all([
      this.prisma.habitLog.findMany({
        where: { userId, date: { gte: start, lte: end } },
      }),
      this.prisma.meal.findMany({
        where: { plan: { userId }, date: { gte: start, lte: end } },
      }),
      this.prisma.workoutSession.findMany({
        where: { plan: { userId }, date: { gte: start, lte: end } },
      }),
      this.prisma.habit.findMany({
        where: { userId, active: true },
        select: { id: true, name: true, streak: true, color: true },
        orderBy: { streak: 'desc' },
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
      const sameDay = (d: Date) => d.toDateString() === day.toDateString();
      dailyData.push({
        date: day.toISOString().split('T')[0],
        habits: habits.filter((h) => h.completed && sameDay(h.date)).length,
        meals: meals.filter((m) => m.completed && sameDay(m.date)).length,
        workouts: workoutSessions.filter((w) => w.completed && sameDay(w.date)).length,
      });
    }

    return {
      weekStart: start.toISOString(),
      habits: { total: totalHabits, completed: completedHabits, percentage: totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0 },
      meals: { total: totalMeals, completed: completedMeals, percentage: totalMeals ? Math.round((completedMeals / totalMeals) * 100) : 0 },
      workouts: { total: totalWorkouts, completed: completedWorkouts, percentage: totalWorkouts ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0 },
      habitStreaks: habitList,
      dailyData,
    };
  }

  async getComparison(userId: string, week1Start: Date, week2Start: Date) {
    const [week1, week2] = await Promise.all([
      this.getWeekly(userId, week1Start),
      this.getWeekly(userId, week2Start),
    ]);

    const diff = (a: number, b: number) => a - b;
    return {
      week1,
      week2,
      deltas: {
        habits: diff(week2.habits.percentage, week1.habits.percentage),
        meals: diff(week2.meals.percentage, week1.meals.percentage),
        workouts: diff(week2.workouts.percentage, week1.workouts.percentage),
      },
    };
  }

  async getSummary(userId: string, weekStart: Date, locale = 'es') {
    const report = await this.getWeekly(userId, weekStart);

    const topStreak = report.habitStreaks[0];
    const bestDay = [...report.dailyData].sort(
      (a, b) => b.habits + b.meals + b.workouts - (a.habits + a.meals + a.workouts),
    )[0];
    const worstDay = [...report.dailyData].sort(
      (a, b) => a.habits + a.meals + a.workouts - (b.habits + b.meals + b.workouts),
    )[0];

    const lang = locale === 'en' ? 'inglés' : 'español';
    const prompt = `Eres un coach de estilo de vida. Genera un resumen breve y motivador (2-3 frases, en ${lang}) del progreso semanal del usuario basándote en estos datos:
- Hábitos completados: ${report.habits.percentage}% (${report.habits.completed}/${report.habits.total})
- Comidas seguidas: ${report.meals.percentage}% (${report.meals.completed}/${report.meals.total})
- Entrenamientos completados: ${report.workouts.percentage}% (${report.workouts.completed}/${report.workouts.total})
- Racha más alta: ${topStreak ? `${topStreak.name} (${topStreak.streak} días)` : 'sin rachas activas'}
- Mejor día: ${bestDay?.date || 'N/A'}
- Día más flojo: ${worstDay?.date || 'N/A'}

Tono cercano y constructivo. No uses markdown. Responde solo con el texto del resumen.`;

    let summary = await callGroq(prompt);
    if (!summary) {
      summary =
        locale === 'en'
          ? `This week you completed ${report.habits.percentage}% of your habits, ${report.meals.percentage}% of your meals and ${report.workouts.percentage}% of your workouts. Keep it up!`
          : `Esta semana cumpliste el ${report.habits.percentage}% de tus hábitos, el ${report.meals.percentage}% de tus comidas y el ${report.workouts.percentage}% de tus entrenamientos. ¡Sigue así!`;
    }

    return { summary, report };
  }
}
