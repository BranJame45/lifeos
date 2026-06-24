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
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

const DAY_TO_OFFSET: Record<string, number> = {
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
};

@Injectable()
export class WorkoutPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const now = new Date();
    return this.prisma.workoutPlan.findFirst({
      where: { userId, weekStart: { lte: now }, weekEnd: { gte: now }, confirmed: true },
      include: { sessions: { include: { exercises: true }, orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPreview(userId: string) {
    const now = new Date();
    return this.prisma.workoutPlan.findFirst({
      where: { userId, weekStart: { lte: now }, weekEnd: { gte: now }, confirmed: false },
      include: { sessions: { include: { exercises: true }, orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generate(
    userId: string,
    options?: { days?: Array<{ day: string; minutes: number }> },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Días + minutos elegidos en el formulario; si no, perfil; si no, default.
    const requested = options?.days?.filter((d) => DAY_TO_OFFSET[d.day] !== undefined);
    const chosen =
      requested && requested.length > 0
        ? requested
        : (user.trainingDays?.length > 0 ? user.trainingDays : ['mon', 'wed', 'fri']).map(
            (day) => ({ day, minutes: 60 }),
          );
    const minutesByDay: Record<string, number> = {};
    const sessionDates = chosen.map(({ day, minutes }) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + (DAY_TO_OFFSET[day] ?? 0));
      const dateStr = d.toISOString().split('T')[0];
      minutesByDay[dateStr] = minutes > 0 ? minutes : 60;
      return { day, date: dateStr };
    });

    const goalLabel = user.goal === 'VOLUME' ? 'hipertrofia/volumen (ganar músculo)' : 'déficit calórico (quemar grasa + tonificar)';
    const typeLabel = { GYM: 'gym con máquinas y pesas', CALISTHENICS: 'calistenia en casa', BOTH: 'gym y calistenia' }[user.trainingType] || 'gym';
    const numDays = sessionDates.length;

    let distribution = '';
    if (numDays === 3) distribution = 'Full body (los 3 días) o Upper/Full/Lower';
    else if (numDays === 4) distribution = 'Pecho-Tríceps / Espalda-Bíceps / Pierna / Hombros-Core';
    else if (numDays >= 5) distribution = 'Push / Pull / Legs / Upper / Lower (5 días) o agregar Hombros/Core extra';
    else distribution = 'Full body adaptado';

    const dayLines = sessionDates
      .map((d) => `${d.date}(${d.day}) — ${minutesByDay[d.date]} min disponibles`)
      .join('\n  ');

    const prompt = `Eres un entrenador personal. Genera una rutina semanal de ejercicio en español para este perfil:
- Objetivo: ${goalLabel}
- Tipo de entrenamiento: ${typeLabel}
- Días disponibles (${numDays}) con su tiempo:
  ${dayLines}
- Distribución sugerida: ${distribution}

AJUSTA la cantidad de ejercicios al tiempo de CADA día (aprox. 12-15 min por ejercicio con descansos):
- 30 min -> 3 ejercicios
- 45 min -> 4 ejercicios
- 60 min (1h) -> 5 ejercicios
- 75 min (1h 15) -> 5-6 ejercicios
- 90 min (1h 30) -> 6 ejercicios
- 105 min (1h 45) -> 6-7 ejercicios
- 120 min (2h) -> 7 ejercicios
- 135 min (2h 15) -> 7-8 ejercicios
- 150 min (2h 30) -> 8 ejercicios

Para cada día, genera una sesión con:
- Un grupo muscular principal (e.g., "Pecho y Tríceps", "Espalda y Bíceps", "Piernas", "Hombros y Core", "Full Body")
- La cantidad de ejercicios acorde al tiempo de ese día, con series y repeticiones apropiadas para el objetivo
- Ejercicios acordes al tipo de entrenamiento (${typeLabel})

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
[
  {
    "date": "YYYY-MM-DD",
    "muscleGroup": "grupo muscular",
    "exercises": [
      {"name": "nombre del ejercicio", "sets": 3, "reps": "10-12"}
    ]
  }
]`;

    let parsedSessions: Array<{
      date: string;
      muscleGroup: string;
      exercises: Array<{ name: string; sets: number; reps: string }>;
    }> = [];

    try {
      const raw = await callGroq(prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) parsedSessions = JSON.parse(match[0]);
    } catch {
      parsedSessions = sessionDates.map((d) => ({
        date: d.date,
        muscleGroup: 'Full Body',
        exercises: [
          { name: 'Press de banca / Flexiones', sets: 4, reps: '8-12' },
          { name: 'Sentadillas', sets: 4, reps: '10-12' },
          { name: 'Dominadas / Jalón al pecho', sets: 3, reps: '8-10' },
          { name: 'Peso muerto', sets: 3, reps: '8-10' },
          { name: 'Plancha', sets: 3, reps: '30-45s' },
        ],
      }));
    }

    const plan = await this.prisma.workoutPlan.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        confirmed: false,
        sessions: {
          create: parsedSessions.map((s) => ({
            date: new Date(`${s.date}T09:00:00.000Z`),
            muscleGroup: s.muscleGroup || 'Full Body',
            completed: false,
            exercises: {
              create: (s.exercises || []).map((e) => ({
                name: e.name || 'Ejercicio',
                sets: e.sets || 3,
                reps: String(e.reps || '10-12'),
                completed: false,
              })),
            },
          })),
        },
      },
      include: { sessions: { include: { exercises: true }, orderBy: { date: 'asc' } } },
    });

    return { previewId: plan.id, plan, message: 'Revisa y confirma la rutina de ejercicios' };
  }

  async confirm(id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.workoutPlan.update({
      where: { id },
      data: { confirmed: true },
      include: { sessions: { include: { exercises: true }, orderBy: { date: 'asc' } } },
    });
  }

  async toggleExercise(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    const updated = await this.prisma.exercise.update({
      where: { id },
      data: { completed: !exercise.completed },
      include: { session: true },
    });
    // Check if all exercises in the session are done → mark session complete
    const allExercises = await this.prisma.exercise.findMany({ where: { sessionId: exercise.sessionId } });
    const allDone = allExercises.every((e) => (e.id === id ? !exercise.completed : e.completed));
    if (allDone) {
      await this.prisma.workoutSession.update({ where: { id: exercise.sessionId }, data: { completed: true } });
    }
    return updated;
  }

  async setExerciseWeight(id: string, weight: number | null) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return this.prisma.exercise.update({
      where: { id },
      data: { weight: weight === null || Number.isNaN(weight) ? null : weight },
    });
  }

  async setSessionNotes(id: string, notes: string) {
    const session = await this.prisma.workoutSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.workoutSession.update({
      where: { id },
      data: { notes: notes?.trim() ? notes.trim() : null },
    });
  }

  async suggestSubstitute(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: { session: { include: { plan: { include: { user: true } } } } },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const user = exercise.session?.plan?.user;
    const typeLabel = user
      ? { GYM: 'gym', CALISTHENICS: 'calistenia en casa', BOTH: 'gym o calistenia' }[user.trainingType] || 'gym'
      : 'gym';

    const prompt = `Sugiere 3 ejercicios alternativos para sustituir "${exercise.name}" en una rutina de ${exercise.session.muscleGroup}.
El tipo de entrenamiento es ${typeLabel}.
Responde en español con un JSON: [{"name":"ejercicio","sets":${exercise.sets},"reps":"${exercise.reps}","reason":"por qué es buena alternativa"}]
Sin markdown, solo JSON.`;

    let suggestions: Array<{ name: string; sets: number; reps: string; reason: string }> = [];
    try {
      const raw = await callGroq(prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) suggestions = JSON.parse(match[0]);
    } catch {
      suggestions = [];
    }

    return { original: exercise.name, suggestions };
  }
}
