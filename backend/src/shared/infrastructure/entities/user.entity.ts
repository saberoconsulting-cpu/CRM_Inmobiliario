// shared/infrastructure/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 20, default: 'agent' })
  role: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl: string;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 2, default: 0 })
  commissionRate: string;

  @Column({ name: 'monthly_goal_lots', type: 'int', default: 0 })
  monthlyGoalLots: number;

  @Column({ name: 'monthly_goal_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  monthlyGoalAmount: string;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}