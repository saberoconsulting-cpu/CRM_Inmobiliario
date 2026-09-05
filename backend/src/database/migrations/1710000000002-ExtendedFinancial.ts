// database/migrations/1710000000002-ExtendedFinancial.ts
// Aditivo (sin romper el esquema previo):
//  - sales: aprobación financiera, plan de cuotas y estado del plan
//  - lots: campo de venta (separado/aprobado/vendido) independiente del estado comercial
//  - expenses: family de gasto (inversion/financiamiento/compra_terreno/operacion)
//  - tabla cronograma de cuotas por venta
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendedFinancial1710000000002 implements MigrationInterface {
  name = 'ExtendedFinancial1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // de manera segura, agregamos columnas (IF NOT EXISTS no aplica a ALTER COLUMN,
    // hacemos checks con information_schema)
    const has = async (table: string, col: string): Promise<boolean> => {
      const r = await queryRunner.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
        [table, col],
      );
      return (r && r.length > 0) as boolean;
    };

    // ---- SALES: aprobación y plan ----
    if (!(await has('sales', 'approval_status'))) {
      await queryRunner.query(
        `ALTER TABLE "sales" ADD COLUMN "approval_status" varchar(20) NOT NULL DEFAULT 'pendiente'
           CHECK ("approval_status" IN ('pendiente','aprobada','rechazada','cancelada'))`,
      );
    }
    if (!(await has('sales', 'total_cuotas'))) {
      await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN "total_cuotas" int DEFAULT 0`);
    }
    if (!(await has('sales', 'valor_cuota'))) {
      await queryRunner.query(
        `ALTER TABLE "sales" ADD COLUMN "valor_cuota" numeric(14,2) DEFAULT 0`,
      );
    }
    if (!(await has('sales', 'plan_status'))) {
      await queryRunner.query(
        `ALTER TABLE "sales" ADD COLUMN "plan_status" varchar(20) NOT NULL DEFAULT 'pendiente'
           CHECK ("plan_status" IN ('pendiente','al_dia','en_mora','refinanciada','cancelada'))`,
      );
    }
    if (!(await has('sales', 'approved_by'))) {
      await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN "approved_by" BIGINT REFERENCES "users"("id")`);
    }
    if (!(await has('sales', 'approved_at'))) {
      await queryRunner.query(`ALTER TABLE "sales" ADD COLUMN "approved_at" timestamptz`);
    }

    // ---- LOTS: estado de venta comercial (no toca el CHECK de "status") ----
    if (!(await has('lots', 'selling_stage'))) {
      await queryRunner.query(
        `ALTER TABLE "lots" ADD COLUMN "selling_stage" varchar(20) NOT NULL DEFAULT 'disponible'
           CHECK ("selling_stage" IN ('disponible','separado','aprobado','vendido','cancelado'))`,
      );
    }

    // ---- EXPENSES: clasificación de gasto = pedido del cliente ----
    if (!(await has('expenses', 'expense_class'))) {
      await queryRunner.query(
        `ALTER TABLE "expenses" ADD COLUMN "expense_class" varchar(30) NOT NULL DEFAULT 'operacion'
           CHECK ("expense_class" IN ('inversion','financiamiento','compra_terreno','operacion'))`,
      );
    }

    // ---- CRONOGRAMA DE CUOTAS (plan por venta, agenda derivada) ----
    const tSchedule = await queryRunner.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sale_installments'`,
    );
    if (!tSchedule || tSchedule.length === 0) {
      await queryRunner.query(`
        CREATE TABLE "sale_installments" (
          "id" BIGSERIAL PRIMARY KEY,
          "sale_id" BIGINT NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
          "installment_no" int NOT NULL,
          "amount" numeric(14,2) NOT NULL,
          "due_date" date NOT NULL,
          "payment_id" BIGINT REFERENCES "payments"("id") ON DELETE SET NULL,
          "status" varchar(20) NOT NULL DEFAULT 'pendiente'
            CHECK ("status" IN ('pendiente','pagado','vencido')),
          "created_at" timestamptz NOT NULL DEFAULT now(),
          UNIQUE ("sale_id","installment_no")
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_installments"`);
    // se omiten drops para no arriesgar columnas usadas por versiones anteriores
  }
}
