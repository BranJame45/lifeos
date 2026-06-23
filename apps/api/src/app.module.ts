import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { HabitsModule } from './habits/habits.module';
import { MealPlansModule } from './meal-plans/meal-plans.module';
import { WorkoutPlansModule } from './workout-plans/workout-plans.module';
import { ShoppingListModule } from './shopping-list/shopping-list.module';
import { CalendarModule } from './calendar/calendar.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    HabitsModule,
    MealPlansModule,
    WorkoutPlansModule,
    ShoppingListModule,
    CalendarModule,
    ReportsModule,
    AiModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
