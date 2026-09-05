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

  @IsOptional()
  @IsNumber()
  salePrice!: number;

  // Comisión inmobiliaria (opcional y configurable por lote)
  appliesCommission?: boolean;

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  // Fraccionamiento opcional
  @IsOptional()
  @IsNumber()
  totalCuotas?: number;

  @IsOptional()
  @IsNumber()
  valorCuota?: number;

  @IsOptional()
  @IsString()
  saleDate?: string;

  @IsOptional()
  @IsString()
  conditions?: string;
}