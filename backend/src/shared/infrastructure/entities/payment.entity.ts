// shared/infrastructure/entities/payment.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'lot_id' })
  lotId: number;

  @Column({ name: 'client_id', nullable: true })
  clientId: number;

  @Column({ name: 'agent_id', nullable: true })
  agentId: number;

  @Column({ length: 30 })
  type: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ name: 'payment_method', length: 30, default: 'otro' })
  paymentMethod: string;

  @Column({ length: 100, nullable: true })
  reference: string;

  @Column({ name: 'voucher_url', length: 500, nullable: true })
  voucherUrl: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @Column({ length: 20, default: 'pendiente' })
  status: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}