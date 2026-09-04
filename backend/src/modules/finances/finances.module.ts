// modules/finances/finances.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialTransactionEntity } from '../../shared/infrastructure/entities/financial-transaction.entity';
import { ExpenseEntity } from '../../shared/infrastructure/entities/expense.entity';
import { AuditLogEntity } from '../../shared/infrastructure/entities/audit-log.entity';
import { NotificationsGateway } from '../../shared/infrastructure/websocket/notifications.gateway';
import { FinancesController } from './interface/finances.controller';
import { FinancesService } from './application/finances.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialTransactionEntity, ExpenseEntity, AuditLogEntity]),
  ],
  controllers: [FinancesController],
  providers: [FinancesService, NotificationsGateway],
  exports: [NotificationsGateway],
})
export class FinancesModule {}