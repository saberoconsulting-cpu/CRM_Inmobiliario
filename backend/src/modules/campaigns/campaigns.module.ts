// modules/campaigns/campaigns.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignEntity } from '../../shared/infrastructure/entities/campaign.entity';
import { ClientEntity } from '../../shared/infrastructure/entities/client.entity';
import { SaleEntity } from '../../shared/infrastructure/entities/sale.entity';
import { AuditLogEntity } from '../../shared/infrastructure/entities/audit-log.entity';
import { CampaignsController } from './interface/campaigns.controller';
import { CampaignsService } from './application/campaigns.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignEntity, ClientEntity, SaleEntity, AuditLogEntity]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}