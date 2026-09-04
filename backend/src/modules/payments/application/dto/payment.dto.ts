// modules/payments/application/dto/payment.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  projectId!: number;

  @IsNumber()
  lotId!: number;

  @IsOptional()
  clientId?: number;

  @IsOptional()
  agentId?: number;

  @IsString()
  @IsNotEmpty()
  type!: 'reserva' | 'adelanto' | 'primera_cuota' | 'cuota' | 'otros';

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  note?: string;
}