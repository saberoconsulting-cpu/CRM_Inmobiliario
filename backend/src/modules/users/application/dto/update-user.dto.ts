// modules/users/application/dto/update-user.dto.ts
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  monthlyGoalLots?: number;

  @IsOptional()
  @IsNumber()
  monthlyGoalAmount?: number;

  @IsOptional()
  @IsArray()
  projectIds?: number[];
}