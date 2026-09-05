// database/migrations/1710000000004-PaymentEvidence.ts
// Control de pagos: medio (yape/transferencia/deposito), referencia y comprobante imágen.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentEvidence1710000000004 implements MigrationInterface {
  name = 'PaymentEvidence1710000000004';
  private async has(q: QueryRunner, table: string, col: string) {
    const r = await q.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
      [table, col],
    );
    return !!(r && r.length > 0);
  }
  async up(q: QueryRunner): Promise<void> {
    if (!(await this.has(q, 'payments', 'payment_method'))) await q.query(`ALTER TABLE "payments" ADD COLUMN "payment_method" varchar(30) NOT NULL DEFAULT 'otro'`);
    if (!(await this.has(q, 'payments', 'reference'))) await q.query(`ALTER TABLE "payments" ADD COLUMN "reference" varchar(100)`);
    if (!(await this.has(q, 'payments', 'voucher_url'))) await q.query(`ALTER TABLE "payments" ADD COLUMN "voucher_url" varchar(500)`);
  }
  async down(): Promise<void> {
    return;
  }
}
