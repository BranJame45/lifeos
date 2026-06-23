# Master Prompt — LifeOS (Asistente Personal de Estilo de Vida con IA)

> Copia y pega este prompt completo en una IA (Claude, Cursor, ChatGPT) para que genere el scaffold del proyecto.
> Este prompt es solo para crear la ESTRUCTURA y archivos base. No implementa la lógica completa — eso se hace fase por fase.

---

## PROMPT

Eres un arquitecto de software fullstack. Tu tarea es crear el scaffold completo de una aplicación llamada LifeOS.

Lee atentamente todo lo que sigue antes de escribir cualquier archivo.

---

### CONTEXTO DEL PROYECTO

LifeOS es un asistente personal de estilo de vida. Ayuda al usuario a planificar y registrar su alimentación semanal, rutinas de ejercicio y hábitos diarios. La IA genera planes personalizados (comidas y ejercicio) basándose en el perfil del usuario (peso, estatura, objetivo físico, disponibilidad) y siempre pide confirmación antes de aplicar cambios.

**Stack:**
- Backend: NestJS (TypeScript) + Prisma + PostgreSQL
- Frontend: Next.js 15 + Tailwind CSS + next-intl (ES/EN) + Recharts
- IA: Groq API (llama-3.3-70b-versatile)
- Contenedores: Docker + docker-compose
- Auth: JWT + bcrypt

---

### ESTRUCTURA DE ARCHIVOS QUE DEBES CREAR

```
lifeos/
├── apps/
│   ├── api/                          (NestJS)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       └── login.dto.ts
│   │   │   ├── profile/
│   │   │   │   ├── profile.module.ts
│   │   │   │   ├── profile.controller.ts
│   │   │   │   ├── profile.service.ts
│   │   │   │   └── dto/
│   │   │   ├── habits/
│   │   │   │   ├── habits.module.ts
│   │   │   │   ├── habits.controller.ts
│   │   │   │   ├── habits.service.ts
│   │   │   │   └── dto/
│   │   │   ├── meal-plans/
│   │   │   │   ├── meal-plans.module.ts
│   │   │   │   ├── meal-plans.controller.ts
│   │   │   │   ├── meal-plans.service.ts
│   │   │   │   └── dto/
│   │   │   ├── workout-plans/
│   │   │   │   ├── workout-plans.module.ts
│   │   │   │   ├── workout-plans.controller.ts
│   │   │   │   ├── workout-plans.service.ts
│   │   │   │   └── dto/
│   │   │   ├── shopping-list/
│   │   │   │   ├── shopping-list.module.ts
│   │   │   │   ├── shopping-list.controller.ts
│   │   │   │   └── shopping-list.service.ts
│   │   │   ├── calendar/
│   │   │   │   ├── calendar.module.ts
│   │   │   │   ├── calendar.controller.ts
│   │   │   │   └── calendar.service.ts
│   │   │   ├── reports/
│   │   │   │   ├── reports.module.ts
│   │   │   │   ├── reports.controller.ts
│   │   │   │   └── reports.service.ts
│   │   │   ├── ai/
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   └── context.builder.ts
│   │   │   └── prisma/
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── web/                          (Next.js)
│       ├── app/
│       │   ├── [locale]/
│       │   │   ├── layout.tsx
│       │   │   ├── today/
│       │   │   │   └── page.tsx       (Vista principal "Mi Día")
│       │   │   ├── calendar/
│       │   │   │   └── page.tsx
│       │   │   ├── nutrition/
│       │   │   │   └── page.tsx
│       │   │   ├── workout/
│       │   │   │   └── page.tsx
│       │   │   ├── habits/
│       │   │   │   └── page.tsx
│       │   │   ├── shopping/
│       │   │   │   └── page.tsx
│       │   │   ├── reports/
│       │   │   │   └── page.tsx
│       │   │   ├── chat/
│       │   │   │   └── page.tsx
│       │   │   └── setup/
│       │   │       └── page.tsx       (Setup de perfil inicial)
│       │   └── globals.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   └── Header.tsx
│       │   ├── today/
│       │   │   ├── TodayMeals.tsx
│       │   │   ├── TodayWorkout.tsx
│       │   │   └── TodayHabits.tsx
│       │   ├── habits/
│       │   │   ├── HabitCard.tsx
│       │   │   └── HabitStreak.tsx
│       │   ├── nutrition/
│       │   │   ├── MealPlanCard.tsx
│       │   │   └── PlanConfirmModal.tsx
│       │   ├── workout/
│       │   │   ├── WorkoutCard.tsx
│       │   │   └── ExerciseChecklist.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Modal.tsx
│       │       ├── Card.tsx
│       │       └── ProgressBar.tsx
│       ├── lib/
│       │   ├── api.ts
│       │   └── auth.ts
│       ├── messages/
│       │   ├── es.json
│       │   └── en.json
│       ├── i18n/
│       │   ├── request.ts
│       │   └── routing.ts
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
├── docker-compose.yml
├── .env.example
└── README.md
```

---

### INSTRUCCIONES DE IMPLEMENTACIÓN

**1. prisma/schema.prisma**
Crear schema completo con estos modelos:
- `User` (id, email, password, name, age, weight, height, goal: DEFICIT|VOLUME, activityLevel: SEDENTARY|MODERATE|ACTIVE, restrictions: String[], mealPreferences: String[], trainingDays: String[], trainingType: GYM|CALISTHENICS|BOTH, createdAt)
- `Habit` (id, userId, name, category, color, frequency: String[], target, streak, active)
- `HabitLog` (id, habitId, userId, date, completed, note)
- `MealPlan` (id, userId, weekStart, weekEnd, confirmed, createdAt) con relación a `Meal`
- `Meal` (id, planId, date, type: breakfast|lunch|snack|dinner, description, completed)
- `WorkoutPlan` (id, userId, weekStart, weekEnd, confirmed, createdAt) con relación a `WorkoutSession`
- `WorkoutSession` (id, planId, date, muscleGroup, completed, notes) con relación a `Exercise`
- `Exercise` (id, sessionId, name, sets, reps, weight, completed)
- `ShoppingList` (id, userId, planId, weekStart, createdAt) con relación a `ShoppingItem`
- `ShoppingItem` (id, listId, name, category, purchased)
- `ChatMessage` (id, userId, role, content, createdAt)

**2. context.builder.ts (módulo AI)**
Función que construye el contexto del usuario para el LLM:
```typescript
async buildUserContext(userId: string): Promise<string> {
  // Obtiene: perfil (peso, altura, objetivo, restricciones)
  // Plan de comidas activo de la semana
  // Plan de ejercicio activo
  // Hábitos con sus rachas
  // Cumplimiento de las últimas 2 semanas
  // Día actual de la semana
  // Retorna string formateado para system prompt
}
```

**3. Flujo de generación de plan (meal-plans y workout-plans)**
Ambos módulos deben seguir este patrón:
- `POST /generate` → llama a la IA, devuelve el plan propuesto SIN guardarlo, con un `preview_id` temporal
- `POST /confirm/:previewId` → el usuario confirma → se guarda en BD y se activa
- Este flujo es OBLIGATORIO — la IA nunca guarda un plan sin confirmación

**4. Cálculo de racha (streak) en habits.service.ts**
```typescript
async updateStreak(habitId: string): Promise<number> {
  // Obtiene logs de los últimos días en orden descendente
  // Cuenta días consecutivos completados desde hoy hacia atrás
  // Actualiza habit.streak en BD
  // Retorna el streak actualizado
}
```

**5. calendar.service.ts**
Tres métodos principales:
- `getDayView(userId, date)` → retorna comidas, sesión de ejercicio y hábitos del día
- `getWeekView(userId, from, to)` → retorna resumen por día de la semana
- `getMonthView(userId, month, year)` → retorna heatmap de cumplimiento por día

**6. docker-compose.yml**
Igual que FinSmart pero con nombre de BD `lifeos` y puertos distintos si corren en paralelo.

**7. messages/es.json y messages/en.json**
Claves para: nav, today, habits, nutrition, workout, calendar, shopping, reports, chat, setup, common.

---

### PROMPTS DE IA — estructura base para ai.service.ts

**System prompt para plan de comidas:**
```
Eres un nutricionista de apoyo. Genera un plan de comidas semanal variado para el usuario.
NO incluyas gramos ni calorías exactas. Usa criterio general según el objetivo.
El plan debe incluir solo las comidas configuradas por el usuario.
Evita repetir el mismo plato más de 2 veces en la semana.
Objetivo del usuario: {goal}
Restricciones: {restrictions}
Comidas a planificar: {mealPreferences}
Responde SIEMPRE en {lang}.
```

**System prompt para rutina de ejercicio:**
```
Eres un entrenador personal. Genera una rutina semanal de ejercicio.
Días disponibles: {trainingDays}
Tipo de entrenamiento: {trainingType}
Objetivo: {goal}
Incluye: grupo muscular, ejercicios con series y repeticiones.
Sugiere sustituciones para ejercicios sin equipamiento.
Responde SIEMPRE en {lang}.
```

---

### VARIABLES DE ENTORNO

**apps/api/.env.example:**
```env
DATABASE_URL=postgresql://user:password@db:5432/lifeos
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=24h
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3002
FRONTEND_URL=http://localhost:3000
```

**apps/web/.env.example:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

---

### AL FINALIZAR — genera PROJECT_STRUCTURE.md

Una vez creados todos los archivos, genera un archivo `PROJECT_STRUCTURE.md` en la raíz con:

1. **Mapa de archivos** — árbol completo con descripción de cada archivo/carpeta
2. **Flujo de generación de plan** — cómo funciona el ciclo generar → confirmar → activar
3. **Cómo funciona el contexto de la IA** — qué datos toma y cómo los inyecta al prompt
4. **Cómo funciona el cálculo de racha** — lógica de streak por hábito
5. **Cómo funciona la vista "Mi Día"** — qué endpoints llama y cómo agrega los datos
6. **Cómo agregar un nuevo tipo de hábito** — pasos exactos
7. **Cómo correr el proyecto localmente** — comandos paso a paso con Docker
8. **Cómo hacer deploy** — Render + Vercel + Supabase
