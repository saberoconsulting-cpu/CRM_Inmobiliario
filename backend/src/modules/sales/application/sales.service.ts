// modules/sales/application/sales.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleEntity } from '../../../shared/infrastructure/entities/sale.entity';
import { LotEntity } from '../../../shared/infrastructure/entities/lot.entity';
import { UserEntity } from '../../../shared/infrastructure/entities/user.entity';
import { FinancialTransactionEntity } from '../../../shared/infrastructure/entities/financial-transaction.entity';
import { AuditLogEntity } from '../../../shared/infrastructure/entities/audit-log.entity';
import { NotificationsGateway } from '../../../shared/infrastructure/websocket/notifications.gateway';
import { CreateSaleDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly saleRepo: Repository<SaleEntity>,
    @InjectRepository(LotEntity)
    private readonly lotRepo: Repository<LotEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(FinancialTransactionEntity)
    private readonly txnRepo: Repository<FinancialTransactionEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async audit(userId: number, action: string, entity?: string, entityId?: number) {
    await this.auditRepo.save({ userId, action, entity, entityId });
  }

  async create(dto: CreateSaleDto, actorId: number) {
    const lot = await this.lotRepo.findOne({ where: { id: dto.lotId } });
    if (!lot) throw new BadRequestException('Lote no encontrado');
    if (lot.status === 'vendido') {
      throw new BadRequestException('El lote ya fue vendido y no puede venderse nuevamente');
    }

    const agent = await this.userRepo.findOne({ where: { id: dto.agentId } });
    const commissionRate = Number(agent?.commissionRate || 0);
    const commission = (dto.salePrice * commissionRate) / 100;

    const sale = this.saleRepo.create({
      projectId: dto.projectId,
      lotId: dto.lotId,
      clientId: dto.clientId,
      agentId: dto.agentId,
      salePrice: String(dto.salePrice),
      saleDate: dto.saleDate || undefined,
      commission: String(commission),
      conditions: dto.conditions,
      status: 'cerrada',
    });
    const saved = await this.saleRepo.save(sale);

    // Marcar lote como vendido
    lot.status = 'vendido';
    lot.clientId = dto.clientId ?? lot.clientId;
    lot.agentId = dto.agentId;
    await this.lotRepo.save(lot);

    // Registrar ingreso financiero inmutable por venta
    await this.txnRepo.save({
      projectId: dto.projectId,
      lotId: dto.lotId,
      clientId: dto.clientId,
      createdBy: actorId,
      type: 'ingreso',
      category: 'venta',
      concept: `Venta del lote ${lot.code}`,
      amount: String(dto.salePrice),
    });

    await this.audit(actorId, 'CREAR_VENTA', 'sales', saved.id);

    // Emitir eventos en tiempo real
    this.gateway.emitToAll('sale.created', saved);
    this.gateway.emitToAll('lot.updated', lot);

    return { ...saved, commissionRate, commission };
  }

  async list(filters: {
    projectId?: number;
    agentId?: number;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
  }) {
    const qb = this.saleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect(UserEntity, 'u', 'u.id = s.agent_id')
      .leftJoinAndSelect(LotEntity, 'l', 'l.id = s.lot_id')
      .select([
        's.id', 's.projectId', 's.lotId', 's.clientId', 's.agentId',
        's.salePrice', 's.saleDate', 's.commission', 's.conditions', 's.status', 's.createdAt',
      ])
      .addSelect(['u.name AS agentName', 'l.code AS lotCode']);
    if (filters.projectId) qb.andWhere('s.project_id = :projectId', { projectId: filters.projectId });
    if (filters.agentId) qb.andWhere('s.agent_id = :agentId', { agentId: filters.agentId });
    if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
    if (filters.from) qb.andWhere('s.sale_date >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('s.sale_date <= :to', { to: filters.to });
    if (filters.search) qb.andWhere('l.code ILIKE :search', { search: `%${filters.search}%` });
    qb.orderBy('s.sale_date', 'DESC');
    const raw = await qb.getRawMany();
    return raw.map((r) => ({
      id: Number(r.s_id), projectId: Number(r.s_project_id), lotId: Number(r.s_lot_id),
      clientId: r.s_client_id ? Number(r.s_client_id) : null,
      agentId: r.s_agent_id ? Number(r.s_agent_id) : null,
      salePrice: Number(r.s_sale_price), saleDate: r.s_sale_date,
      commission: Number(r.s_commission), conditions: r.s_conditions,
      status: r.s_status, createdAt: r.s_created_at,
      agentName: r.agentName || null, lotCode: r.lotCode || null,
    }));
  }
}