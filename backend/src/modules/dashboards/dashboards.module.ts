// modules/dashboards/dashboards.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '../../shared/infrastructure/entities/client.entity';
import { SaleEntity } from '../../shared/infrastructure/entities/sale.entity';
import { LotEntity } from '../../shared/infrastructure/entities/lot.entity';
import { FinancialTransactionEntity } from '../../shared/infrastructure/entities/financial-transaction.entity';
import { PaymentEntity } from '../../shared/infrastructure/entities/payment.entity';
import { ExpenseEntity } from '../../shared/infrastructure/entities/expense.entity';
import { UserEntity } from '../../shared/infrastructure/entities/user.entity';
import { DashboardsController } from './interface/dashboards.controller';
import { DashboardsService } from './application/dashboards.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientEntity, SaleEntity, LotEntity, FinancialTransactionEntity,
      PaymentEntity, ExpenseEntity, UserEntity,
    ]),
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}