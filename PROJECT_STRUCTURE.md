# LifeOS — PROJECT_STRUCTURE

## 1. Mapa de archivos

```
lifeos/
├── apps/
│   ├── api/                              # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts                   # CORS, /api prefix, ValidationPipe
│   │   │   ├── app.module.ts             # Importa los 9 módulos
│   │   │   ├── auth/                     # Login + JWT refresh
│   │   │   ├── profile/                  # GET/PUT perfil del usuario
│   │   │   ├── habits/                   # CRUD hábitos + log diario + streak
│   │   │   ├── meal-plans/               # Generar → confirmar → toggle comidas
│   │   │   ├── workout-plans/            # Generar → confirmar → toggle ejercicios
│   │   │   ├── shopping-list/            # Lista de compras por plan
│   │   │   ├── calendar/                 # Vista día/semana/mes
│   │   │   ├── reports/                  # Reporte semanal + comparación
│   │   │   ├── ai/                       # Chat con Groq + context builder
│   │   │   └── prisma/prisma.service.ts
│   │   ├── prisma/schema.prisma          # 10 modelos + 3 enums
│   │   ├── Dockerfile, package.json, tsconfig.json, .env.example
│   └── web/                              # Frontend Next.js
│       ├── app/[locale]/
│       │   ├── layout.tsx                # Sidebar + Header
│       │   ├── today/page.tsx            # "Mi Día": comidas, ejercicio, hábitos
│       │   ├── calendar/page.tsx
│       │   ├── nutrition/page.tsx
│       │   ├── workout/page.tsx
│       │   ├── habits/page.tsx
│       │   ├── shopping/page.tsx
│       │   ├── reports/page.tsx
│       │   ├── chat/page.tsx
│       │   └── setup/page.tsx            # Configuración de perfil
│       ├── components/
│       │   ├── layout/ Sidebar.tsx, Header.tsx
│       │   ├── today/ TodayMeals, TodayWorkout, TodayHabits
│       │   ├── habits/ HabitCard, HabitStreak
│       │   ├── nutrition/ MealPlanCard, PlanConfirmModal
│       │   ├── workout/ WorkoutCard, ExerciseChecklist
│       │   └── ui/ Button, Modal, Card, ProgressBar
│       ├── lib/ api.ts, auth.ts
│       ├── messages/ es.json, en.json
│       ├── i18n/ routing.ts, request.ts
│       └── middleware.ts, next.config.ts, Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── PROJECT_STRUCTURE.md
```

## 2. Flujo de generación de plan

### Comidas:
1. **POST /meal-plans/generate** → Crea un MealPlan con `confirmed: false`, devuelve `previewId`
2. El frontend muestra el plan al usuario para revisión
3. **POST /meal-plans/confirm/:id** → Cambia `confirmed: true`, activa el plan
4. La IA genera automáticamente una lista de compras asociada

### Ejercicio:
1. **POST /workout-plans/generate** → Crea WorkoutPlan con `confirmed: false`
2. El usuario revisa las sesiones y ejercicios propuestos
3. **POST /workout-plans/confirm/:id** → Activa la rutina

**Regla:** La IA NUNCA guarda un plan sin confirmación explícita del usuario.

## 3. Contexto de la IA

`context.builder.ts` construye un string con:
- Perfil completo (peso, altura, objetivo, restricciones, preferencias)
- Plan de comidas activo
- Plan de ejercicio activo (con número de sesiones)
- Hábitos activos con sus rachas actuales
- Cumplimiento de las últimas 2 semanas
- Día actual de la semana

Este contexto se inyecta al system prompt de Groq para que el asistente conozca la situación real del usuario.

## 4. Cálculo de racha (streak)

El método `updateStreak(habitId)` en `habits.service.ts`:
1. Obtiene todos los logs del hábito ordenados por fecha descendente
2. Empieza desde hoy y cuenta hacia atrás días consecutivos donde haya un log completado
3. Se detiene en el primer día sin log
4. Actualiza `habit.streak` en la BD

## 5. Vista "Mi Día"

`GET /calendar/day?date=` llama a `CalendarService.getDayView()` que consulta en paralelo:
- **Comidas:** meals del día desde el plan activo
- **Ejercicio:** sesión del día con ejercicios
- **Hábitos:** habitLogs completados del día

El frontend `today/page.tsx` renderiza 3 columnas con los componentes `TodayMeals`, `TodayWorkout` y `TodayHabits`.

## 6. Cómo agregar un nuevo tipo de hábito

Los hábitos son de categoría libre (strings). Solo hay que:
1. Agregar la categoría en el DTO `CreateHabitDto` si se quiere validar
2. Agregar la traducción en `messages/es.json` y `messages/en.json` bajo `habits.categories`
3. El frontend ya itera sobre las categorías disponibles

## 7. Cómo correr el proyecto

```bash
# Docker (todo junto)
docker compose up --build

# Desarrollo (sin Docker)
docker compose up db -d              # Solo BD
cd apps/api && npm run start:dev     # Backend :3002
cd apps/web && npm run dev           # Frontend :3000
```

## 8. Deploy

- **API:** Render — build: `npm install && npx prisma generate && npm run build`, start: `npm run start:prod`
- **Web:** Vercel — dir: `apps/web`, env: `NEXT_PUBLIC_API_URL`
- **BD:** Supabase PostgreSQL
