import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContextBuilder } from './context.builder';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextBuilder: ContextBuilder,
  ) {}

  async chat(userId: string, message: string) {
    const userContext = await this.contextBuilder.buildUserContext(userId);

    await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message },
    });

    const systemPrompt = `Eres un asistente de estilo de vida personal.
Contexto del usuario:
${userContext}

Responde preguntas sobre sus planes, hábitos y progreso.
Puedes sugerir cambios en comidas o ejercicios, pero siempre espera confirmación antes de aplicarlos.`;

    const groqResponse = await this.callGroq(systemPrompt, message);

    const assistantMessage = await this.prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: groqResponse },
    });

    const history = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { message: assistantMessage, history: history.reverse() };
  }

  private async callGroq(systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return 'AI service not configured. Set GROQ_API_KEY.';

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response';
    } catch {
      return 'Error calling AI service';
    }
  }
}
