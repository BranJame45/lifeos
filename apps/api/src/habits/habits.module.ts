import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HabitsController],
  providers: [HabitsService, PrismaService],
})
export class HabitsModule {}
