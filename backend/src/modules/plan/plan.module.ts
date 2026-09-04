// modules/plan/plan.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from '../../shared/infrastructure/entities/plan.entity';
import { BlockEntity } from '../../shared/infrastructure/entities/block.entity';
import { LotEntity } from '../../shared/infrastructure/entities/lot.entity';
import { LotStatusHistoryEntity } from '../../shared/infrastructure/entities/lot-status-history.entity';
import { AuditLogEntity } from '../../shared/infrastructure/entities/audit-log.entity';
import { NotificationsGateway } from '../../shared/infrastructure/websocket/notifications.gateway';
import { PlanController } from './interface/plan.controller';
import { PlanService } from './application/plan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanEntity,
      BlockEntity,
      LotEntity,
      LotStatusHistoryEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [PlanController],
  providers: [PlanService, NotificationsGateway],
  exports: [NotificationsGateway],
})
export class PlanModule {}