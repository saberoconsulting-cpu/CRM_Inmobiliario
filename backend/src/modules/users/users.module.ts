// modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../shared/infrastructure/entities/user.entity';
import { UserProjectEntity } from '../../shared/infrastructure/entities/user-project.entity';
import { AuditLogEntity } from '../../shared/infrastructure/entities/audit-log.entity';
import { SaleEntity } from '../../shared/infrastructure/entities/sale.entity';
import { PaymentEntity } from '../../shared/infrastructure/entities/payment.entity';
import { UsersController } from './interface/users.controller';
import { UsersService } from './application/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserProjectEntity,
      AuditLogEntity,
      SaleEntity,
      PaymentEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}