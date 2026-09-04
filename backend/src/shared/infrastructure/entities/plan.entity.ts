// shared/infrastructure/entities/plan.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plan')
export class PlanEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'image_width', type: 'int', default: 1000 })
  imageWidth: number;

  @Column({ name: 'image_height', type: 'int', default: 800 })
  imageHeight: number;

  @Column({ length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'view_box', length: 120, nullable: true })
  viewBox: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}