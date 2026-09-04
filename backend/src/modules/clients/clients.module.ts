// modules/clients/clients.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '../../shared/infrastructure/entities/client.entity';
import { ClientContactEntity } from '../../shared/infrastructure/entities/client-contact.entity';
import { LotEntity } from '../../shared/infrastructure/entities/lot.entity';
import { PaymentEntity } from '../../shared/infrastructure/entities/payment.entity';
import { SaleEntity } from '../../shared/infrastructure/entities/sale.entity';
import { AuditLogEntity } from '../../shared/infrastructure/entities/audit-log.entity';
import { ClientsController } from './interface/clients.controller';
import { ClientsService } from './application/clients.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientEntity,
      ClientContactEntity,
      LotEntity,
      PaymentEntity,
      SaleEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}