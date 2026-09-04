// modules/auth/application/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../shared/infrastructure/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    // Actualizar último acceso
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        photoUrl: user.photoUrl,
        commissionRate: user.commissionRate,
        monthlyGoalLots: user.monthlyGoalLots,
        monthlyGoalAmount: user.monthlyGoalAmount,
      },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
    return { ok: true, message: 'Contraseña actualizada' };
  }

  getProfile(userId: number) {
    return this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.email', 'u.name', 'u.phone', 'u.role', 'u.status',
        'u.photoUrl', 'u.commissionRate', 'u.monthlyGoalLots', 'u.monthlyGoalAmount',
        'u.lastLoginAt', 'u.createdAt',
      ])
      .where('u.id = :id', { id: userId })
      .getOne();
  }
}