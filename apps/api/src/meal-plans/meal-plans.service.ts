import { Injectable, NotFoundException } from '@nestjs/common';
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
        temperature: 0.8,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

@Injectable()
export class MealPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const now = new Date();
    return this.prisma.mealPlan.findFirst({
      where: { userId, weekStart: { lte: now }, weekEnd: { gte: now }, confirmed: true },
      include: { meals: { orderBy: [{ date: 'asc' }, { type: 'asc' }] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPreview(userId: string) {
    const now = new Date();
    return this.prisma.mealPlan.findFirst({
      where: { userId, weekStart: { lte: now }, weekEnd: { gte: now }, confirmed: false },
      include: { meals: { orderBy: [{ date: 'asc' }, { type: 'asc' }] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generate(userId: string, weeks: 1 | 2 = 1) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const numWeeks = weeks === 2 ? 2 : 1;
    const totalDays = 7 * numWeeks;

    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + (totalDays - 1));
    weekEnd.setHours(23, 59, 59, 999);

    const dayLabels = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const weekDates: { date: string; day: string }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      weekDates.push({ date: d.toISOString().split('T')[0], day: dayLabels[d.getDay()] });
    }

    const goalLabel = user.goal === 'VOLUME' ? 'volumen (ganar músculo)' : 'déficit calórico (perder peso)';
    const activityLabel = { SEDENTARY: 'sedentario', MODERATE: 'moderado', ACTIVE: 'activo' }[user.activityLevel] || 'moderado';
    const mealsToGenerate = user.mealPreferences?.length > 0 ? user.mealPreferences : ['breakfast', 'lunch', 'dinner'];
    const mealTypeMap: Record<string, string> = { breakfast: 'desayuno', lunch: 'almuerzo', snack: 'merienda', dinner: 'cena' };
    const mealTypesLabel = mealsToGenerate.map((m) => mealTypeMap[m] || m).join(', ');
    const totalEntries = weekDates.length * mealsToGenerate.length;
    const periodLabel = numWeeks === 2 ? 'quincenal (2 semanas)' : 'semanal (1 semana)';

    const prompt = `Eres un nutricionista. Genera un plan de comidas ${periodLabel} variado en español para este perfil:
- Peso: ${user.weight || 70}kg, Estatura: ${user.height || 170}cm
- Objetivo: ${goalLabel}
- Nivel de actividad: ${activityLabel}
- Restricciones alimentarias: ${user.restrictions?.join(', ') || 'ninguna'}
- Tipos de comida a planificar: ${mealTypesLabel}

Fechas (${totalDays} días): ${weekDates.map((d) => `${d.date}(${d.day})`).join(', ')}

INSTRUCCIONES:
- Genera exactamente ${totalEntries} entradas: ${mealsToGenerate.join(' + ')} para cada uno de los ${totalDays} días
- Varía los platos: no repitas el mismo plato más de 2 veces por semana
- Descripciones naturales y concretas ("Avena con plátano y miel", "Arroz con pollo a la plancha y ensalada")
- Sin gramos ni calorías exactas
- type debe ser exactamente uno de: breakfast, lunch, snack, dinner

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
[{"date":"YYYY-MM-DD","type":"breakfast","description":"descripción del plato"}]`;

    let parsedMeals: Array<{ date: string; type: string; description: string }> = [];
    try {
      const raw = await callGroq(prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) parsedMeals = JSON.parse(match[0]);
    } catch {
      parsedMeals = [];
    }

    if (!parsedMeals.length) {
      // fallback: create placeholder meals so the user still gets a plan to edit
      parsedMeals = weekDates.flatMap((d) =>
        mealsToGenerate.map((type) => ({
          date: d.date,
          type,
          description: 'Por definir — edita en el chat con el asistente',
        })),
      );
    }

    const plan = await this.prisma.mealPlan.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        confirmed: false,
        meals: {
          create: parsedMeals.map((m) => ({
            date: new Date(`${m.date}T12:00:00.000Z`),
            type: m.type || 'lunch',
            description: m.description || 'Comida por definir',
            completed: false,
          })),
        },
      },
      include: { meals: { orderBy: [{ date: 'asc' }, { type: 'asc' }] } },
    });

    return { previewId: plan.id, plan, message: 'Revisa y confirma el plan de comidas' };
  }

  async confirm(id: string) {
    const plan = await this.prisma.mealPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.mealPlan.update({
      where: { id },
      data: { confirmed: true },
      include: { meals: { orderBy: [{ date: 'asc' }, { type: 'asc' }] } },
    });
  }

  async toggleMeal(id: string) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new NotFoundException('Meal not found');
    return this.prisma.meal.update({ where: { id }, data: { completed: !meal.completed } });
  }
}
