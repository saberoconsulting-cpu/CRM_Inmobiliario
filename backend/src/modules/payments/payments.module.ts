// modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../../shared/infrastructure/entities/payment.entity';
import { LotEntity } from '../../shared/infrastructure/entities/lot.entity';
import { LotStatusHistoryEntity } from '../../shared/infrastructure/entities/lot-status-history.entity';
import { FinancialTransactionEntity } from '../../shared/infrastructure/entities/financial-transaction.entity';
import { NotificationsGateway } from '../../shared/infrastructure/websocket/notifications.gateway';
import { PaymentsController } from './interface/payments.controller';
import { PaymentsService } from './application/payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      LotEntity,
      LotStatusHistoryEntity,
      FinancialTransactionEntity,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, NotificationsGateway],
  exports: [NotificationsGateway],
})
export class PaymentsModule {}