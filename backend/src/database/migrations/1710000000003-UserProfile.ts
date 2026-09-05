// database/migrations/1710000000003-UserProfile.ts
// Aditivo: contacto y presentación del perfil para agentes y administración.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProfile1710000000003 implements MigrationInterface {
  name = 'UserProfile1710000000003';

  private async hasCol(q: QueryRunner, table: string, col: string): Promise<boolean> {
    const r = await q.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
      [table, col],
    );
    return !!(r && r.length > 0);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = queryRunner;
    if (!(await this.hasCol(q, 'users', 'whatsapp'))) {
      await q.query(`ALTER TABLE "users" ADD COLUMN "whatsapp" varchar(30)`);
    }
    if (!(await this.hasCol(q, 'users', 'bio'))) {
      await q.query(`ALTER TABLE "users" ADD COLUMN "bio" text`);
    }
  }

  public async down(): Promise<void> {
    // Aditivo; no se eliminan columnas de contacto para preservar datos.
    return;
  }
}
