import { PartialType } from '@nestjs/common';
import { CreateHabitDto } from './create-habit.dto';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {}
