import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserProfileDto {
  @IsNumber()
  id: number;
  @IsString()
  name: string;
  @IsString()
  email: string;
  @IsDate()
  createdAt: Date;
  @IsNumber()
  monthlyBudget: number;

  @IsNumber()
  @IsOptional()
  totalSpent?: number;

  @IsNumber()
  @IsOptional()
  budgetUsagePercentage?: number;

  @IsString()
  plan: string;
}
