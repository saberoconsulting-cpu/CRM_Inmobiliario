// modules/sales/sales.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleEntity } from '../../shared/infrastructure/entities/sale.entity';
import { SaleInstallmentEntity } from '../../shared/infrastructure/entities/sale-installment.entity';
import { LotEntity } from '../../shared/infrastructure/entities/lot.entity';
import { UserEntity } from '../../shared/infrastructure/entities/user.entity';
import { FinancialTransactionEntity } from '../../shared/infrastructure/entities/financial-transaction.entity';
import { AuditLogEntity } from '../../shared/infrastructure/entities/audit-log.entity';
import { NotificationsGateway } from '../../shared/infrastructure/websocket/notifications.gateway';
import { SalesController } from './interface/sales.controller';
import { SalesService } from './application/sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleEntity,
      SaleInstallmentEntity,
      LotEntity,
      UserEntity,
      FinancialTransactionEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService, NotificationsGateway],
  exports: [NotificationsGateway],
})
export class SalesModule {}