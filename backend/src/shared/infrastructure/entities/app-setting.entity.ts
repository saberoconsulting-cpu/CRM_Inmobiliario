// shared/infrastructure/entities/app-setting.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('app_settings')
export class AppSettingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 80 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
