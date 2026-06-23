# LifeOS — Asistente Personal de Estilo de Vida con IA

## Contexto General

LifeOS es una aplicación web personal que actúa como asistente de estilo de vida. El objetivo es ayudar a una sola persona a planificar y registrar su alimentación semanal/quincenal, sus rutinas de ejercicio y sus hábitos diarios, todo gestionado con ayuda de IA que conoce el contexto del usuario (peso, estatura, objetivo físico, disponibilidad horaria).

El usuario objetivo es una persona que quiere organizar su día a día de forma inteligente: qué comer, cuándo entrenar, qué músculos trabajar, qué hábitos cumplir — y ver su progreso de forma visual.

---

## Decisiones de Arquitectura

- **Un solo usuario** con autenticación simple (email + contraseña).
- **Idioma:** Español e inglés (toggle ES/EN en el frontend con next-intl). La IA responde en el idioma activo del usuario.
- **La IA no actúa sola:** siempre presenta un plan al usuario para su confirmación antes de aplicarlo.
- **Sin conteo estricto de calorías/gramos:** la IA planifica con criterio general según el objetivo del usuario (déficit o volumen).
- **MVP** — sin funciones sociales, sin compartir datos.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | NestJS (TypeScript) |
| ORM | Prisma |
| Base de datos | PostgreSQL (Supabase) |
| Frontend | Next.js 15 + Tailwind CSS |
| i18n | next-intl (ES / EN) |
| Gráficos | Recharts |
| IA | Groq API (llama-3.3-70b-versatile) |
| Auth | JWT + bcrypt |
| Validación | Zod |
| Contenedores | Docker + docker-compose |
| Hosting Backend | Render |
| Hosting Frontend | Vercel |

---

## Módulos del Sistema

### Módulo 1: Autenticación
- Login email + contraseña
- JWT 24h con refresh token
- Sin registro público

### Módulo 2: Perfil del Usuario (Setup Inicial)
El usuario completa un perfil que la IA usará como contexto permanente:

- Nombre
- Edad
- Peso (kg)
- Estatura (cm)
- Objetivo físico: **Déficit calórico** (bajar peso) | **Volumen** (ganar músculo) — configurable en cualquier momento
- Nivel de actividad: sedentario | moderado | activo
- Restricciones alimentarias (opcional): vegetariano, sin gluten, sin lácteos, sin cerdo, otro (texto libre)
- Preferencias de comidas: qué comidas desea planificar (checkboxes): desayuno, lonche/merienda, almuerzo, cena — configurable
- Disponibilidad para ejercicio: días de la semana disponibles (checkboxes: L, M, X, J, V, S, D)
- Tipo de entrenamiento disponible: gym con máquinas | calistenia en casa | ambos

### Módulo 3: Alimentación

**3a. Plan de Comidas:**
- La IA genera un plan semanal de las comidas seleccionadas en el perfil
- El plan no especifica gramos ni calorías exactas — usa criterio general ("plato de avena con frutas", "pollo a la plancha con ensalada")
- El plan considera: objetivo (déficit/volumen), restricciones y preferencias del usuario
- Variedad: la IA evita repetir los mismos platos más de 2 veces en la semana
- Periodicidad de generación: semanal o quincenal (configurable)
- Antes de aplicar, muestra el plan al usuario para confirmación o ajuste
- El usuario puede pedir cambios en el chat ("cambia el desayuno del miércoles por algo más ligero")

**3b. Lista de Compras:**
- Al confirmar el plan semanal/quincenal, la IA genera automáticamente una lista de compras agrupada por categoría (frutas, carnes, lácteos, granos, etc.)
- El usuario puede marcar ítems como comprados
- La lista se resetea al generar un nuevo plan

**3c. Registro de Comidas:**
- El usuario puede marcar cada comida del día como completada o no
- Esto alimenta el reporte semanal

### Módulo 4: Rutina de Ejercicio

**4a. Plan de Ejercicio:**
- La IA genera una rutina semanal basada en:
  - Días disponibles del usuario
  - Tipo de entrenamiento (gym / calistenia / ambos)
  - Objetivo físico (déficit = más cardio + tonificación; volumen = hipertrofia)
- Por cada día de entrenamiento: grupo muscular principal + ejercicios sugeridos con series y repeticiones
- Ejemplos de distribución sugerida:
  - 3 días: Full body / Upper / Lower
  - 4 días: Pecho-tríceps / Espalda-bíceps / Pierna / Hombros-core
  - 5+ días: Push / Pull / Legs / Upper / Lower
- La IA sugiere el plan pero el usuario lo confirma antes de guardarlo
- Incluye día(s) de descanso activo o descanso total según la disponibilidad

**4b. Registro de Ejercicio:**
- Por cada sesión: marcar ejercicios como completados
- Registro de peso usado (opcional, para seguimiento de progresión)
- Notas libres por sesión ("me dolió la rodilla", "aumenté peso en press banca")

**4c. Sustitución de ejercicios:**
- El usuario puede pedir al chat: "no tengo mancuernas hoy, cambia los ejercicios de hombro"
- La IA sugiere alternativas en el acto

### Módulo 5: Hábitos Diarios

- El usuario crea sus hábitos (lectura, tesis, meditación, hidratación, etc.)
- Cada hábito tiene:
  - Nombre
  - Categoría (Salud, Estudio, Personal, Trabajo, Otro)
  - Color
  - Frecuencia: diario | días específicos de la semana
  - Duración o cantidad objetivo (opcional): "30 minutos" o "8 vasos"
  - Racha (streak): días consecutivos cumplidos
- Checklist diario de hábitos con checkbox por hábito
- Vista del día: muestra hábitos pendientes del día actual

### Módulo 6: Calendario y Vista Diaria

**Vista "Mi Día":**
- Todo integrado en una sola vista por día:
  - Comidas planificadas del día (con checkbox de completado)
  - Entrenamiento del día (con checklist de ejercicios)
  - Hábitos del día (con checkboxes)
- Es la pantalla principal de la app

**Vista Semanal:**
- Calendario semanal mostrando:
  - Qué días hay entrenamiento y qué músculo
  - Qué días hay plan de comidas activo
  - Indicador de hábitos completados vs pendientes por día

**Vista Mensual:**
- Calendario mensual con heatmap de cumplimiento
- Días verdes (todo cumplido) / amarillos (parcial) / rojos (nada cumplido)

### Módulo 7: Reportes Semanales

Al final de cada semana:
- Porcentaje de hábitos completados
- Porcentaje de sesiones de ejercicio completadas
- Porcentaje de comidas seguidas según el plan
- Racha actual por hábito
- Gráfico de cumplimiento diario de la semana (barras)
- Comparativo con semana anterior
- La IA genera un resumen breve: "Esta semana cumpliste el 80% de tus hábitos. Tu racha de lectura es de 5 días. El miércoles fue tu día más incompleto."

### Módulo 8: Asistente IA con Contexto

**Contexto que la IA conoce siempre:**
- Perfil del usuario (peso, estatura, objetivo, restricciones)
- Plan de comidas activo de la semana
- Plan de ejercicio activo
- Hábitos registrados y sus rachas
- Historial de cumplimiento de las últimas 2 semanas
- Día actual de la semana

**Capacidades del asistente:**
- Generar/regenerar plan de comidas (con confirmación del usuario)
- Generar/regenerar rutina de ejercicio (con confirmación)
- Responder preguntas ("¿qué como mañana?", "¿qué entreno el viernes?")
- Sugerir sustituciones de ejercicios o comidas
- Analizar el progreso ("¿cómo voy esta semana?")
- Motivar y dar feedback basado en el historial real

**Regla importante:** Antes de aplicar cualquier cambio (nuevo plan, modificación), la IA muestra un resumen de lo que va a hacer y espera confirmación explícita del usuario.

---

## Modelo de Datos (Prisma Schema)

```prisma
model User {
  id               String         @id @default(uuid())
  email            String         @unique
  password         String
  name             String
  age              Int?
  weight           Float?
  height           Float?
  goal             FitnessGoal    @default(DEFICIT)
  activityLevel    ActivityLevel  @default(MODERATE)
  restrictions     String[]
  mealPreferences  String[]       // breakfast, lunch, snack, dinner
  trainingDays     String[]       // mon, tue, wed, thu, fri, sat, sun
  trainingType     TrainingType   @default(BOTH)
  createdAt        DateTime       @default(now())

  habits           Habit[]
  habitLogs        HabitLog[]
  mealPlans        MealPlan[]
  workoutPlans     WorkoutPlan[]
  workoutLogs      WorkoutLog[]
  shoppingLists    ShoppingList[]
  chatMessages     ChatMessage[]
}

model Habit {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  name      String
  category  String
  color     String
  frequency String[]  // ['mon','wed','fri'] o ['daily']
  target    String?   // "30 minutos", "8 vasos"
  streak    Int       @default(0)
  active    Boolean   @default(true)
  logs      HabitLog[]
}

model HabitLog {
  id        String   @id @default(uuid())
  habitId   String
  habit     Habit    @relation(fields: [habitId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  date      DateTime
  completed Boolean  @default(false)
  note      String?
}

model MealPlan {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  weekStart DateTime
  weekEnd   DateTime
  meals     Meal[]
  confirmed Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Meal {
  id          String   @id @default(uuid())
  planId      String
  plan        MealPlan @relation(fields: [planId], references: [id])
  date        DateTime
  type        String   // breakfast | lunch | snack | dinner
  description String
  completed   Boolean  @default(false)
}

model WorkoutPlan {
  id        String        @id @default(uuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id])
  weekStart DateTime
  weekEnd   DateTime
  sessions  WorkoutSession[]
  confirmed Boolean       @default(false)
  createdAt DateTime      @default(now())
}

model WorkoutSession {
  id          String     @id @default(uuid())
  planId      String
  plan        WorkoutPlan @relation(fields: [planId], references: [id])
  date        DateTime
  muscleGroup String
  exercises   Exercise[]
  completed   Boolean    @default(false)
  notes       String?
}

model Exercise {
  id          String         @id @default(uuid())
  sessionId   String
  session     WorkoutSession @relation(fields: [sessionId], references: [id])
  name        String
  sets        Int
  reps        String         // "10-12" o "al fallo"
  weight      Float?
  completed   Boolean        @default(false)
}

model WorkoutLog {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  sessionId String
  date      DateTime
  notes     String?
}

model ShoppingList {
  id        String         @id @default(uuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id])
  planId    String
  weekStart DateTime
  items     ShoppingItem[]
  createdAt DateTime       @default(now())
}

model ShoppingItem {
  id         String       @id @default(uuid())
  listId     String
  list       ShoppingList @relation(fields: [listId], references: [id])
  name       String
  category   String
  purchased  Boolean      @default(false)
}

model ChatMessage {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      String   // user | assistant
  content   String
  createdAt DateTime @default(now())
}

enum FitnessGoal    { DEFICIT VOLUME }
enum ActivityLevel  { SEDENTARY MODERATE ACTIVE }
enum TrainingType   { GYM CALISTHENICS BOTH }
```

---

## Endpoints API

```
POST   /auth/login
POST   /auth/refresh

GET    /profile
PUT    /profile

GET    /habits
POST   /habits
PUT    /habits/:id
DELETE /habits/:id
POST   /habits/:id/log          (marcar completado para un día)
GET    /habits/today            (hábitos del día actual)

GET    /meal-plans/current
POST   /meal-plans/generate     (IA genera y devuelve para confirmar)
POST   /meal-plans/confirm/:id  (usuario confirma el plan)
PATCH  /meal-plans/meal/:id     (marcar comida como completada)

GET    /shopping-list/current
PATCH  /shopping-list/item/:id  (marcar ítem como comprado)

GET    /workout-plans/current
POST   /workout-plans/generate  (IA genera y devuelve para confirmar)
POST   /workout-plans/confirm/:id
PATCH  /workout-plans/exercise/:id (marcar ejercicio completado)
POST   /workout-plans/exercise/:id/substitute (IA sugiere alternativa)

GET    /calendar/day?date=
GET    /calendar/week?from=
GET    /calendar/month?month=&year=

GET    /reports/weekly?weekStart=
GET    /reports/comparison?week1=&week2=

GET    /ai/chat
POST   /ai/chat
```

---

## Estructura de Carpetas

```
lifeos/
├── apps/
│   ├── api/                    (NestJS)
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── profile/
│   │   │   ├── habits/
│   │   │   ├── meal-plans/
│   │   │   ├── workout-plans/
│   │   │   ├── shopping-list/
│   │   │   ├── calendar/
│   │   │   ├── reports/
│   │   │   ├── ai/
│   │   │   └── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                    (Next.js)
│       ├── app/
│       │   ├── (auth)/
│       │   ├── today/          (Vista principal "Mi Día")
│       │   ├── calendar/
│       │   ├── nutrition/
│       │   ├── workout/
│       │   ├── habits/
│       │   ├── reports/
│       │   ├── shopping/
│       │   └── chat/
│       └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Variables de Entorno

```env
DATABASE_URL=postgresql://user:password@host:5432/lifeos
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## Fases de Desarrollo

### Fase 1: Setup + Auth + Perfil (Semana 1)
- Inicializar NestJS + Next.js + Prisma
- Auth completo (login, JWT)
- Módulo de perfil con setup inicial
- Docker funcional

### Fase 2: Hábitos + Vista Diaria (Semana 1-2)
- CRUD de hábitos
- Registro diario de hábitos (checklist)
- Frontend: vista "Mi Día" con hábitos

### Fase 3: Alimentación + Lista de Compras (Semana 2-3)
- Integración Groq para generación de plan de comidas
- Flujo: generar → confirmar → aplicar
- Lista de compras automática
- Frontend: vista semanal de comidas

### Fase 4: Rutina de Ejercicio (Semana 3)
- Generación de rutina semanal con IA
- Registro de sesiones y ejercicios
- Sustitución de ejercicios por chat
- Frontend: vista de rutina semanal

### Fase 5: Calendario + Reportes (Semana 4)
- Vista semanal y mensual del calendario
- Reporte semanal con gráficos
- Comparativo de semanas

### Fase 6: Asistente IA + Polish (Semana 5)
- Chat completo con contexto del usuario
- Confirmaciones antes de cambios
- Deploy Render + Vercel
- README + screenshots

---

## Criterios de Éxito

- La IA genera planes de comida y ejercicio coherentes con el perfil del usuario
- El usuario puede ver todo su día en una sola pantalla
- Los reportes muestran progreso real de la semana
- La app corre con docker-compose localmente
- Está desplegada en Render + Vercel con datos reales
