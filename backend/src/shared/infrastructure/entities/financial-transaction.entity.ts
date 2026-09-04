// shared/infrastructure/entities/financial-transaction.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('financial_transactions')
export class FinancialTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', nullable: true })
  projectId: number;

  @Column({ name: 'lot_id', nullable: true })
  lotId: number;

  @Column({ name: 'client_id', nullable: true })
  clientId: number;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId: number;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: number;

  @Column({ length: 10 })
  type: string;

  @Column({ length: 80 })
  category: string;

  @Column({ length: 255 })
  concept: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ name: 'txn_date', type: 'timestamptz', default: () => 'now()' })
  txnDate: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}