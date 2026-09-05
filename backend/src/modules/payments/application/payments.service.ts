// modules/payments/application/payments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../../../shared/infrastructure/entities/payment.entity';
import { LotEntity } from '../../../shared/infrastructure/entities/lot.entity';
import { LotStatusHistoryEntity } from '../../../shared/infrastructure/entities/lot-status-history.entity';
import { FinancialTransactionEntity } from '../../../shared/infrastructure/entities/financial-transaction.entity';
import { NotificationsGateway } from '../../../shared/infrastructure/websocket/notifications.gateway';
import { CreatePaymentDto } from './dto/payment.dto';

// Estado comercial al que conduce cada tipo de pago
const TYPE_STATUS: Record<string, string> = {
  reserva: 'reservado',
  adelanto: 'adelanto',
  primera_cuota: 'primera_cuota',
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(LotEntity)
    private readonly lotRepo: Repository<LotEntity>,
    @InjectRepository(LotStatusHistoryEntity)
    private readonly historyRepo: Repository<LotStatusHistoryEntity>,
    @InjectRepository(FinancialTransactionEntity)
    private readonly txnRepo: Repository<FinancialTransactionEntity>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async register(dto: CreatePaymentDto, actorId: number) {
    const lot = await this.lotRepo.findOne({ where: { id: dto.lotId } });
    const clientRaw = dto.clientId ?? lot?.clientId ?? undefined;
    const agentRaw = dto.agentId ?? lot?.agentId ?? undefined;
    const clientId = typeof clientRaw === 'number' ? clientRaw : undefined;
    const agentId = typeof agentRaw === 'number' ? agentRaw : undefined;

    const payment = this.paymentRepo.create({
      projectId: dto.projectId,
      lotId: dto.lotId,
      clientId,
      agentId,
      type: dto.type,
      amount: String(dto.amount),
      dueDate: dto.dueDate || undefined,
      status: dto.dueDate ? 'pendiente' : 'pagado',
      paidAt: dto.dueDate ? undefined : new Date(),
      note: dto.note,
      createdBy: actorId,
    });
    // Si no hay fecha de vencimiento, se considera pago inmediato (pagado)
    if (!dto.dueDate) payment.status = 'pagado';
    const saved = await this.paymentRepo.save(payment);
    if (!saved || !saved.id) {
      throw new Error('No se pudo registrar el pago');
    }

    // Registrar movimiento financiero inmutable (ingreso)
    await this.txnRepo.save({
      projectId: dto.projectId,
      lotId: dto.lotId,
      clientId,
      paymentId: saved.id,
      createdBy: actorId,
      type: 'ingreso',
      category: dto.type,
      concept: `Pago ${dto.type} del lote ${lot?.code ?? ''}`,
      amount: String(dto.amount),
    });

    // Actualizar estado comercial del lote según el tipo de pago
    if (lot && TYPE_STATUS[dto.type] && lot.status !== 'vendido') {
      const target = TYPE_STATUS[dto.type];
      if (lot.status !== target) {
        await this.historyRepo.save({
          lotId: lot.id,
          fromStatus: lot.status,
          toStatus: target,
          userId: actorId,
          note: `Pago por ${dto.type}`,
        });
        lot.status = target;
        await this.lotRepo.save(lot);
        this.gateway.emitToAll('lot.updated', lot);
      }
    }

    // Emitir evento en tiempo real
    this.gateway.emitToAll('payment.created', saved);
    return saved;
  }

  async list(filters: {
    projectId?: number;
    lotId?: number;
    agentId?: number;
    status?: string;
    type?: string;
  }) {
    const qb = this.paymentRepo.createQueryBuilder('p');
    if (filters.projectId) qb.where('p.project_id = :projectId', { projectId: filters.projectId });
    if (filters.lotId) qb.andWhere('p.lot_id = :lotId', { lotId: filters.lotId });
    if (filters.agentId) qb.andWhere('p.agent_id = :agentId', { agentId: filters.agentId });
    if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
    if (filters.type) qb.andWhere('p.type = :type', { type: filters.type });
    qb.orderBy('p.created_at', 'DESC');
    return qb.getMany();
  }

  async markPaid(paymentId: number) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) return null;
    payment.status = 'pagado';
    payment.paidAt = new Date();
    payment.dueDate = null;
    const saved = await this.paymentRepo.save(payment);
    this.gateway.emitToAll('payment.created', saved);
    return saved;
  }

  // Alertas: cuotas vencidas y próximas a vencer (7 días)
  async alerts() {
    const today = new Date().toISOString().slice(0, 10);
    const plus7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const overdue = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :s AND p.due_date < :today', { s: 'pendiente', today })
      .getMany();
    const upcoming = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :s AND p.due_date >= :today AND p.due_date <= :plus7', { s: 'pendiente', today, plus7 })
      .getMany();
    return { overdue, upcoming };
  }
}