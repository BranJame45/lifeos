import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateHabitDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  color: string;

  @IsArray()
  frequency: string[];

  @IsOptional()
  @IsString()
  target?: string;
}
