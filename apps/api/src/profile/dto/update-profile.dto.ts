import { IsString, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';
import { FitnessGoal, ActivityLevel, TrainingType } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsEnum(FitnessGoal)
  goal?: FitnessGoal;

  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @IsOptional()
  @IsArray()
  restrictions?: string[];

  @IsOptional()
  @IsArray()
  mealPreferences?: string[];

  @IsOptional()
  @IsArray()
  trainingDays?: string[];

  @IsOptional()
  @IsEnum(TrainingType)
  trainingType?: TrainingType;
}
