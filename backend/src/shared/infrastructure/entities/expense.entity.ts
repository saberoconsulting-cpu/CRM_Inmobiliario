// shared/infrastructure/entities/expense.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', nullable: true })
  projectId: number;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId: number;

  @Column({ name: 'category', length: 80 })
  category: string;

  // --- Ampliado: familia de gasto para reportes (migración 1710000000002) ---
  @Column({ name: 'expense_class', length: 30, default: 'operacion' })
  expenseClass: string;

  @Column({ length: 255 })
  concept: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ name: 'expense_date', type: 'date', default: () => 'CURRENT_DATE' })
  expenseDate: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}