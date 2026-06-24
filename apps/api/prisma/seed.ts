import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

async function main() {
  const email = 'brandon@lifeos.app';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('User already exists — deleting old data to re-seed...');
    await prisma.chatMessage.deleteMany({ where: { userId: existing.id } });
    await prisma.shoppingItem.deleteMany({ where: { list: { userId: existing.id } } });
    await prisma.shoppingList.deleteMany({ where: { userId: existing.id } });
    await prisma.exercise.deleteMany({ where: { session: { plan: { userId: existing.id } } } });
    await prisma.workoutSession.deleteMany({ where: { plan: { userId: existing.id } } });
    await prisma.workoutPlan.deleteMany({ where: { userId: existing.id } });
    await prisma.workoutLog.deleteMany({ where: { userId: existing.id } });
    await prisma.meal.deleteMany({ where: { plan: { userId: existing.id } } });
    await prisma.mealPlan.deleteMany({ where: { userId: existing.id } });
    await prisma.habitLog.deleteMany({ where: { userId: existing.id } });
    await prisma.habit.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const hashedPassword = await bcrypt.hash('LifeOS2026!', 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Brandon',
      age: 22,
      weight: 75,
      height: 175,
      goal: 'DEFICIT',
      activityLevel: 'MODERATE',
      restrictions: ['gluten'],
      mealPreferences: ['breakfast', 'lunch', 'dinner'],
      trainingDays: ['mon', 'wed', 'fri'],
      trainingType: 'GYM',
    },
  });

  // ── HABITS ──────────────────────────────────────────────────────────────────
  const habits = await Promise.all([
    prisma.habit.create({ data: { userId: user.id, name: 'Beber 2L de agua', category: 'salud', color: '#3b82f6', frequency: ['mon','tue','wed','thu','fri','sat','sun'], target: '2 litros', streak: 12, active: true } }),
    prisma.habit.create({ data: { userId: user.id, name: 'Meditar 10 min', category: 'mente', color: '#8b5cf6', frequency: ['mon','tue','wed','thu','fri'], target: '10 minutos', streak: 5, active: true } }),
    prisma.habit.create({ data: { userId: user.id, name: 'Leer 20 páginas', category: 'aprendizaje', color: '#f59e0b', frequency: ['mon','tue','wed','thu','fri','sat','sun'], target: '20 páginas', streak: 3, active: true } }),
    prisma.habit.create({ data: { userId: user.id, name: 'Sin redes sociales antes de las 9am', category: 'mente', color: '#ef4444', frequency: ['mon','tue','wed','thu','fri'], target: undefined, streak: 8, active: true } }),
    prisma.habit.create({ data: { userId: user.id, name: 'Dormir 8h', category: 'salud', color: '#10b981', frequency: ['mon','tue','wed','thu','fri','sat','sun'], target: '8 horas', streak: 6, active: true } }),
  ]);

  // Habit logs: last 21 days (simulate realistic usage)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let dayOffset = 21; dayOffset >= 1; dayOffset--) {
    const date = daysAgo(dayOffset);
    const dow = ['sun','mon','tue','wed','thu','fri','sat'][date.getDay()];

    for (const habit of habits) {
      if (!habit.frequency.includes(dow)) continue;
      // Simulate ~80% completion rate, lower on weekends
      const roll = Math.random();
      const threshold = ['sat','sun'].includes(dow) ? 0.65 : 0.82;
      if (roll < threshold) {
        await prisma.habitLog.create({
          data: { habitId: habit.id, userId: user.id, date, completed: true },
        });
      }
    }
  }

  // ── MEAL PLAN (current week, confirmed) ────────────────────────────────────
  const weekStart = getMonday(today);
  const weekEnd = addDays(weekStart, 6);

  const mealTypes = ['Desayuno', 'Almuerzo', 'Cena'];
  const mealDescriptions: Record<string, string[]> = {
    Desayuno: [
      'Avena con plátano y miel',
      'Huevos revueltos con aguacate y tostadas de arroz',
      'Yogur griego con frutos rojos y granola sin gluten',
      'Batido de proteínas con leche de almendra y avena',
      'Tortilla de 3 huevos con espinacas y queso',
      'Pan de maíz con pavo y tomate',
      'Panqueques de avena con arándanos',
    ],
    Almuerzo: [
      'Pechuga de pollo a la plancha con arroz integral y brócoli',
      'Ensalada de atún con garbanzos y aceite de oliva',
      'Lomo saltado con arroz blanco (sin soja)',
      'Salmón al horno con puré de camote',
      'Bowl de quinoa con pollo, aguacate y maíz',
      'Tallarines de arroz con verduras salteadas',
      'Pollo al curry con arroz basmati',
    ],
    Cena: [
      'Sopa de verduras con pollo desmenuzado',
      'Tortilla española con ensalada verde',
      'Filete de res a la plancha con espárragos',
      'Pechuga en salsa de tomate con ensalada',
      'Ceviche de pescado con camote',
      'Revuelto de huevos con champiñones y pavo',
      'Crema de zapallo con pan de arroz',
    ],
  };

  const mealPlan = await prisma.mealPlan.create({
    data: { userId: user.id, weekStart, weekEnd, confirmed: true },
  });

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const isPast = date < today;
    for (const type of mealTypes) {
      await prisma.meal.create({
        data: {
          planId: mealPlan.id,
          date,
          type,
          description: mealDescriptions[type][i],
          completed: isPast ? Math.random() > 0.15 : false,
        },
      });
    }
  }

  // ── WORKOUT PLAN (current week, confirmed) ─────────────────────────────────
  const workoutPlan = await prisma.workoutPlan.create({
    data: { userId: user.id, weekStart, weekEnd, confirmed: true },
  });

  // Mon = Pecho/Tríceps, Wed = Espalda/Bíceps, Fri = Piernas/Hombros
  const sessions = [
    { offset: 0, muscleGroup: 'Pecho y Tríceps', exercises: [
      { name: 'Press banca', sets: 4, reps: '10-12', weight: 70 },
      { name: 'Aperturas con mancuernas', sets: 3, reps: '12', weight: 18 },
      { name: 'Fondos en paralelas', sets: 3, reps: '10', weight: null },
      { name: 'Press francés', sets: 3, reps: '12', weight: 25 },
      { name: 'Extensiones de tríceps en polea', sets: 3, reps: '15', weight: 20 },
    ]},
    { offset: 2, muscleGroup: 'Espalda y Bíceps', exercises: [
      { name: 'Dominadas', sets: 4, reps: '8', weight: null },
      { name: 'Remo con barra', sets: 4, reps: '10', weight: 60 },
      { name: 'Jalón al pecho', sets: 3, reps: '12', weight: 55 },
      { name: 'Curl de bíceps con barra', sets: 3, reps: '12', weight: 35 },
      { name: 'Curl martillo', sets: 3, reps: '12', weight: 14 },
    ]},
    { offset: 4, muscleGroup: 'Piernas y Hombros', exercises: [
      { name: 'Sentadilla con barra', sets: 4, reps: '10', weight: 80 },
      { name: 'Prensa de piernas', sets: 3, reps: '12', weight: 120 },
      { name: 'Peso muerto rumano', sets: 3, reps: '10', weight: 60 },
      { name: 'Press militar', sets: 3, reps: '10', weight: 40 },
      { name: 'Elevaciones laterales', sets: 4, reps: '15', weight: 10 },
    ]},
  ];

  for (const s of sessions) {
    const date = addDays(weekStart, s.offset);
    const isPast = date < today;
    const session = await prisma.workoutSession.create({
      data: {
        planId: workoutPlan.id,
        date,
        muscleGroup: s.muscleGroup,
        completed: isPast ? true : false,
        notes: isPast ? 'Buena sesión, subí peso en el primer ejercicio.' : null,
      },
    });
    for (const ex of s.exercises) {
      await prisma.exercise.create({
        data: {
          sessionId: session.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          completed: isPast ? true : false,
        },
      });
    }
  }

  // ── SHOPPING LIST (from current meal plan) ─────────────────────────────────
  const shoppingList = await prisma.shoppingList.create({
    data: { userId: user.id, planId: mealPlan.id, weekStart },
  });

  const items = [
    { name: 'Pechuga de pollo (1kg)', category: 'Proteínas', purchased: true },
    { name: 'Salmón fresco (400g)', category: 'Proteínas', purchased: true },
    { name: 'Huevos (12 unidades)', category: 'Proteínas', purchased: true },
    { name: 'Atún en lata (3 latas)', category: 'Proteínas', purchased: false },
    { name: 'Filete de res (300g)', category: 'Proteínas', purchased: false },
    { name: 'Arroz integral (1kg)', category: 'Carbohidratos', purchased: true },
    { name: 'Avena sin gluten (500g)', category: 'Carbohidratos', purchased: true },
    { name: 'Quinoa (500g)', category: 'Carbohidratos', purchased: false },
    { name: 'Camote (1kg)', category: 'Carbohidratos', purchased: true },
    { name: 'Pan de arroz (1 paquete)', category: 'Carbohidratos', purchased: false },
    { name: 'Brócoli (2 unidades)', category: 'Verduras', purchased: true },
    { name: 'Espinacas (bolsa 200g)', category: 'Verduras', purchased: true },
    { name: 'Tomates (6 unidades)', category: 'Verduras', purchased: true },
    { name: 'Champiñones (250g)', category: 'Verduras', purchased: false },
    { name: 'Zapallo (1/2 kg)', category: 'Verduras', purchased: false },
    { name: 'Aguacate (3 unidades)', category: 'Frutas', purchased: true },
    { name: 'Plátanos (6 unidades)', category: 'Frutas', purchased: true },
    { name: 'Arándanos congelados (300g)', category: 'Frutas', purchased: false },
    { name: 'Yogur griego (500g)', category: 'Lácteos', purchased: true },
    { name: 'Leche de almendra (1L)', category: 'Lácteos', purchased: false },
    { name: 'Aceite de oliva (500ml)', category: 'Condimentos', purchased: true },
    { name: 'Granola sin gluten', category: 'Condimentos', purchased: false },
  ];

  for (const item of items) {
    await prisma.shoppingItem.create({ data: { listId: shoppingList.id, ...item } });
  }

  // ── CHAT HISTORY ───────────────────────────────────────────────────────────
  const chatHistory = [
    { role: 'user', content: 'Hola, ¿qué ejercicios me recomiendas para mejorar mi press banca?' },
    { role: 'assistant', content: 'Para mejorar tu press banca te recomiendo: 1) **Aislamiento de tríceps** con extensiones en polea (debilidad común), 2) **Fondos en paralelas con peso** para fuerza funcional, 3) **Press inclinado** para trabajar la porción clavicular del pectoral. También asegúrate de trabajar la movilidad de hombros y escapular. ¿Cuánto estás levantando actualmente?' },
    { role: 'user', content: 'Estoy en 70kg, quiero llegar a 90kg en 3 meses' },
    { role: 'assistant', content: 'Pasar de 70 a 90kg en 3 meses es ambicioso pero alcanzable si eres consistente. Te recomiendo una progresión lineal: sube 2.5kg cada semana. Esto se llama método SL5x5. En semana 12 estarías cerca de los 90kg. Claves: come suficiente proteína (mínimo 150g/día), duerme 8h y no saltes la sesión de pecho. ¿Quieres que ajuste tu plan de entrenamiento para enfocarlo en fuerza?' },
    { role: 'user', content: 'Sí, y también quiero saber qué comer antes de entrenar' },
    { role: 'assistant', content: 'Pre-entrenamiento ideal (1-2h antes): **Carbohidrato de digestión media + proteína ligera**. Ejemplos perfectos para ti (sin gluten): avena con plátano y un scoop de proteína, o arroz con pechuga de pollo. Evita grasas y fibra alta antes de entrenar porque ralentizan la digestión. Si entrenas temprano y no puedes comer, un plátano + café solo puede ser suficiente.' },
    { role: 'user', content: '¿Cómo voy con mis hábitos esta semana?' },
    { role: 'assistant', content: 'Según tus registros vas muy bien 💪 El hábito de agua y sueño los tienes casi al 100%. El de meditación bajó un poco a mitad de semana, ¿algo que te distrajo? La lectura la llevas bien. En general tu semana está por encima del 80% de cumplimiento, lo que es excelente para mantener progreso sostenible.' },
  ];

  for (const msg of chatHistory) {
    await prisma.chatMessage.create({ data: { userId: user.id, ...msg } });
  }

  console.log('\n✅ Seed completo.');
  console.log('   Usuario:    brandon@lifeos.app');
  console.log('   Contraseña: LifeOS2026!');
  console.log('   Datos:      21 días de hábitos, plan semanal de comidas, rutina gym, lista de compras, historial de chat.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
