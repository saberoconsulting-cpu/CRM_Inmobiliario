// modules/users/application/users.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../shared/infrastructure/entities/user.entity';
import { UserProjectEntity } from '../../../shared/infrastructure/entities/user-project.entity';
import { AuditLogEntity } from '../../../shared/infrastructure/entities/audit-log.entity';
import { SaleEntity } from '../../../shared/infrastructure/entities/sale.entity';
import { PaymentEntity } from '../../../shared/infrastructure/entities/payment.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserProjectEntity)
    private readonly userProjectRepo: Repository<UserProjectEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(SaleEntity)
    private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
  ) {}

  private async audit(userId: number, action: string, entity?: string, entityId?: number) {
    await this.auditRepo.save({ userId, action, entity, entityId });
  }

  async createAgent(dto: CreateAgentDto, actorId: number) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('El correo ya está registrado');
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: 'agent',
      status: 'active',
      passwordHash: await bcrypt.hash(dto.password, 10),
      commissionRate: String(dto.commissionRate),
      monthlyGoalLots: dto.monthlyGoalLots ?? 0,
      monthlyGoalAmount: String(dto.monthlyGoalAmount ?? 0),
    });
    const saved = await this.userRepo.save(user);
    if (dto.projectIds?.length) {
      await this.userProjectRepo.save(
        dto.projectIds.map((projectId) => ({ userId: saved.id, projectId })),
      );
    }
    await this.audit(actorId, 'CREAR_AGENTE', 'users', saved.id);
    return saved;
  }

  async createAdmin(dto: CreateAdminDto, actorId: number) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('El correo ya está registrado');
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: 'admin',
      status: 'active',
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.userRepo.save(user);
    if (dto.projectIds?.length) {
      await this.userProjectRepo.save(
        dto.projectIds.map((projectId) => ({ userId: saved.id, projectId })),
      );
    }
    await this.audit(actorId, 'CREAR_ADMIN', 'users', saved.id);
    return saved;
  }

  async list(role?: string, status?: string) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.email', 'u.name', 'u.phone', 'u.role', 'u.status',
        'u.photoUrl', 'u.commissionRate', 'u.monthlyGoalLots', 'u.monthlyGoalAmount',
        'u.lastLoginAt', 'u.createdAt',
      ]);
    if (role) qb.where('u.role = :role', { role });
    if (status) qb.andWhere('u.status = :status', { status });
    qb.orderBy('u.createdAt', 'DESC');
    const users = await qb.getMany();
    return users.map(({ passwordHash, ...u }) => u);
  }

  async findAgents() {
    return this.list('agent');
  }

  async findAdmins() {
    return this.list('admin');
  }

  async update(id: number, dto: UpdateUserDto, actorId: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.commissionRate !== undefined) user.commissionRate = String(dto.commissionRate);
    if (dto.monthlyGoalLots !== undefined) user.monthlyGoalLots = dto.monthlyGoalLots;
    if (dto.monthlyGoalAmount !== undefined) user.monthlyGoalAmount = String(dto.monthlyGoalAmount);
    const saved = await this.userRepo.save(user);
    if (dto.projectIds) {
      await this.userProjectRepo.delete({ userId: id });
      if (dto.projectIds.length) {
        await this.userProjectRepo.save(dto.projectIds.map((projectId) => ({ userId: id, projectId })));
      }
    }
    await this.audit(actorId, 'EDITAR_USUARIO', 'users', id);
    return saved;
  }

  async setStatus(id: number, status: 'active' | 'inactive', actorId: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.status = status;
    await this.userRepo.save(user);
    await this.audit(actorId, status === 'active' ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO', 'users', id);
    return { ok: true };
  }

  async resetPassword(id: number, newPassword: string, actorId: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    await this.audit(actorId, 'RESET_PASSWORD', 'users', id);
    return { ok: true, temporaryPassword: newPassword };
  }

  async activity(id: number) {
    const [sales, payments] = await Promise.all([
      this.saleRepo.count({ where: { agentId: id } }),
      this.paymentRepo.count({ where: { agentId: id } }),
    ]);
    const user = await this.userRepo.findOne({ where: { id } });
    return { sales, payments, lastLoginAt: user?.lastLoginAt };
  }

  async projectsOf(userId: number) {
    const rows = await this.userProjectRepo.find({ where: { userId } });
    return rows.map((r) => r.projectId);
  }
}