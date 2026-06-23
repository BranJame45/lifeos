# LifeOS — Asistente Personal de Estilo de Vida con IA

Planificación semanal de comidas, rutinas de ejercicio y hábitos diarios con ayuda de IA.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Next.js 15 + Tailwind CSS + Recharts
- **IA:** Groq API (Llama 3.3 70B)
- **Auth:** JWT + bcrypt
- **Infra:** Docker + docker-compose

## Desarrollo local

```bash
# Backend
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# Frontend
cd apps/web
cp .env.example .env
npm install
npm run dev

# O todo con Docker:
docker compose up --build
```

API: http://localhost:3002  
Web: http://localhost:3000
