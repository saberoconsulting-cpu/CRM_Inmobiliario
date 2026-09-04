// modules/finances/application/dto/finance.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  projectId?: number;

  @IsOptional()
  campaignId?: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  concept!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  expenseDate?: string;
}

export class CreateAdditionalIncomeDto {
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsNotEmpty()
  concept!: string;

  @IsNumber()
  amount!: number;
}