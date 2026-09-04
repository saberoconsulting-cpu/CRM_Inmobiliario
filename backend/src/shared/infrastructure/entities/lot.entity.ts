// shared/infrastructure/entities/lot.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lots')
export class LotEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ name: 'block_id', type: 'bigint', nullable: true })
  blockId: number | null;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  points: Array<{ x: number; y: number }>;

  @Column({ name: 'area_m2', type: 'numeric', precision: 12, scale: 2, default: 0 })
  areaM2: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  price: string;

  @Column({ length: 20, default: 'disponible' })
  status: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: number;

  @Column({ name: 'agent_id', nullable: true })
  agentId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}