// shared/infrastructure/entities/audit-log.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_log')
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ length: 120 })
  action: string;

  @Column({ length: 60, nullable: true })
  entity: string;

  @Column({ name: 'entity_id', type: 'bigint', nullable: true, transformer: {
    to: (v: number | null) => (v != null ? String(v) : null),
    from: (v: string | null) => (v != null ? Number(v) : null),
  } })
  entityId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}