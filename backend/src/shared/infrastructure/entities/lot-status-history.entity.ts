// shared/infrastructure/entities/lot-status-history.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('lot_status_history')
export class LotStatusHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lot_id' })
  lotId: number;

  @Column({ name: 'from_status', length: 20, nullable: true })
  fromStatus: string;

  @Column({ name: 'to_status', length: 20 })
  toStatus: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  amount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}