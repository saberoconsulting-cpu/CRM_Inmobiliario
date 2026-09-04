// shared/infrastructure/entities/sale.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sales')
export class SaleEntity {
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

  @Column({ name: 'sale_price', type: 'numeric', precision: 14, scale: 2 })
  salePrice: string;

  @Column({ name: 'sale_date', type: 'date', default: () => 'CURRENT_DATE' })
  saleDate: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  commission: string;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ length: 20, default: 'cerrada' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}