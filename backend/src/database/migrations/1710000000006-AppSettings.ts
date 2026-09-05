// database/migrations/1710000000006-AppSettings.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppSettings1710000000006 implements MigrationInterface {
  name = 'AppSettings1710000000006';
  async up(q: QueryRunner): Promise<void> {
    const t = await q.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='app_settings'`);
    if (!t || t.length === 0) {
      await q.query(`
        CREATE TABLE "app_settings" (
          "id" BIGSERIAL PRIMARY KEY,
          "key" varchar(80) NOT NULL UNIQUE,
          "value" text,
          "description" varchar(255),
          "updated_at" timestamptz NOT NULL DEFAULT now()
        )
      `);
      await q.query(`INSERT INTO "app_settings" ("key","value","description") VALUES
        ('company_name','Inmobiliaria S.A.C.','Nombre de la empresa'),
        ('approval_notify','1','Notificar al admin cuando un agente registra venta')`);
    }
  }
  async down(): Promise<void> { return; }
}
