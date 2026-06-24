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
        temperature: 0.5,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

@Injectable()
export class ShoppingListService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const now = new Date();
    return this.prisma.shoppingList.findFirst({
      where: { userId, weekStart: { lte: now } },
      include: { items: { orderBy: [{ category: 'asc' }, { name: 'asc' }] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateFromPlan(userId: string, planId: string) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id: planId },
      include: { meals: true },
    });
    if (!plan) throw new NotFoundException('Meal plan not found');
    if (plan.userId !== userId) throw new NotFoundException('Meal plan not found');

    const mealDescriptions = plan.meals
      .map((m) => `${m.type}: ${m.description}`)
      .join('\n');

    const prompt = `Eres un asistente de compras. Basándote en este plan de comidas semanal, genera una lista de compras completa.

Plan de comidas:
${mealDescriptions}

Extrae todos los ingredientes necesarios y agrúpalos por categoría.
No dupliques ingredientes similares (e.g., si aparece "pollo" múltiples veces, ponlo una sola vez).
Sé específico pero conciso en los nombres.

Categorías válidas: fruits, vegetables, meat, dairy, grains, other

Responde ÚNICAMENTE con JSON válido:
[{"name":"ingrediente","category":"fruits|vegetables|meat|dairy|grains|other"}]`;

    let items: Array<{ name: string; category: string }> = [];
    try {
      const raw = await callGroq(prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) items = JSON.parse(match[0]);
    } catch {
      items = [];
    }

    // Reset: una sola lista activa por usuario. Al generar una nueva, se eliminan
    // las anteriores (sus ítems caen por cascade).
    await this.prisma.shoppingList.deleteMany({ where: { userId } });

    return this.prisma.shoppingList.create({
      data: {
        userId,
        planId,
        weekStart: plan.weekStart,
        items: {
          create: items.map((item) => ({
            name: item.name || 'Ítem',
            category: item.category || 'other',
            purchased: false,
          })),
        },
      },
      include: { items: { orderBy: [{ category: 'asc' }, { name: 'asc' }] } },
    });
  }

  async toggleItem(id: string) {
    const item = await this.prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return this.prisma.shoppingItem.update({ where: { id }, data: { purchased: !item.purchased } });
  }
}
