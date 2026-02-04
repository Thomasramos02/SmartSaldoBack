import { IsString, IsNumber, IsBoolean, IsInt } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsInt()
  categoryId: number;

  @IsBoolean()
  isRecurring: boolean;

  @IsString()
  date: string;

  @IsBoolean()
  isDeductible: boolean;
}
