import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst();
  if (!u) return;
  const logs = await prisma.habitLog.findMany({
    where: { userId: u.id },
    include: { habit: true }
  });
  console.log(logs.map(l => l.habit.name + ' - ' + l.date.toISOString()));
}

main().finally(() => prisma.$disconnect());
