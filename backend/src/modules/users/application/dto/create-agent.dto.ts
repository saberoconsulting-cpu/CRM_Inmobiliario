// modules/users/application/dto/create-agent.dto.ts
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  projectIds!: number[];

  @IsNumber()
  commissionRate!: number;

  @IsNumber()
  @IsOptional()
  monthlyGoalLots?: number;

  @IsNumber()
  @IsOptional()
  monthlyGoalAmount?: number;
}