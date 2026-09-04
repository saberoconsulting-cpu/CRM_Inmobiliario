// shared/infrastructure/entities/user-project.entity.ts
import { Entity, PrimaryColumn } from 'typeorm';

@Entity('user_projects')
export class UserProjectEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'project_id' })
  projectId: number;
}