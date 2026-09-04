// modules/clients/application/dto/client.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  campaignId?: number;

  @IsOptional()
  projectInterestId?: number;

  @IsOptional()
  agentId?: number;

  @IsOptional()
  @IsString()
  pipelineStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddContactDto {
  @IsString()
  @IsNotEmpty()
  note!: string;
}