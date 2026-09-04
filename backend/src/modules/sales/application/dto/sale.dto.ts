// modules/sales/application/dto/sale.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSaleDto {
  @IsNumber()
  projectId!: number;

  @IsNumber()
  lotId!: number;

  @IsOptional()
  clientId?: number;

  @IsNumber()
  @IsNotEmpty()
  agentId!: number;

  @IsNumber()
  salePrice!: number;

  @IsOptional()
  @IsString()
  saleDate?: string;

  @IsOptional()
  @IsString()
  conditions?: string;
}