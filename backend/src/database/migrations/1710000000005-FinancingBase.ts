// database/migrations/1710000000005-FinancingBase.ts
// Comisión inmobiliaria opcional por lote: base neta de cuotas.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinancingBase1710000000005 implements MigrationInterface {
  name = 'FinancingBase1710000000005';
  private async has(q: QueryRunner, c: string) {
    const r = await q.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name=$1`,
      [c],
    );
    return !!(r && r.length > 0);
  }
  async up(q: QueryRunner): Promise<void> {
    if (!(await this.has(q, 'financing_base'))) {
      await q.query(`ALTER TABLE "sales" ADD COLUMN "financing_base" numeric(14,2) NOT NULL DEFAULT 0`);
      // Reparos: las ventas previas mantienen su financiación sobre el precio íntegro.
      await q.query(`UPDATE "sales" SET "financing_base" = "sale_price" WHERE "financing_base" = 0`);
    }
  }
  async down(): Promise<void> {
    return;
  }
}
