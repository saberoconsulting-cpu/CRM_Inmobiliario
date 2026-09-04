// database/migrations/1710000000000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" BIGSERIAL PRIMARY KEY,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "name" varchar(150) NOT NULL,
        "phone" varchar(50),
        "role" varchar(20) NOT NULL DEFAULT 'agent'
          CHECK ("role" IN ('superadmin','admin','agent')),
        "status" varchar(20) NOT NULL DEFAULT 'active'
          CHECK ("status" IN ('active','inactive')),
        "photo_url" varchar(500),
        "commission_rate" numeric(5,2) DEFAULT 0,
        "monthly_goal_lots" int DEFAULT 0,
        "monthly_goal_amount" numeric(14,2) DEFAULT 0,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "description" text,
        "location" varchar(255),
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "cover_image_url" varchar(500),
        "status" varchar(20) NOT NULL DEFAULT 'active'
          CHECK ("status" IN ('active','inactive')),
        "reference_price" numeric(14,2),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_projects" (
        "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "project_id" BIGINT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        PRIMARY KEY ("user_id","project_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "image_url" varchar(500),
        "image_width" int DEFAULT 1000,
        "image_height" int DEFAULT 800,
        "status" varchar(20) NOT NULL DEFAULT 'draft'
          CHECK ("status" IN ('draft','published')),
        "view_box" varchar(120),
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blocks" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "plan_id" BIGINT NOT NULL REFERENCES "plan"("id") ON DELETE CASCADE,
        "name" varchar(50) NOT NULL DEFAULT 'A',
        "points" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "color" varchar(20) DEFAULT '#64748b',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" BIGSERIAL PRIMARY KEY,
        "full_name" varchar(200) NOT NULL,
        "phone" varchar(50),
        "email" varchar(255),
        "source" varchar(50) DEFAULT 'web',
        "campaign_id" BIGINT,
        "project_interest_id" BIGINT,
        "agent_id" BIGINT,
        "pipeline_status" varchar(20) NOT NULL DEFAULT 'nuevo',
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" varchar(200) NOT NULL,
        "channel" varchar(30) NOT NULL DEFAULT 'otro',
        "project_id" BIGINT,
        "budget" numeric(14,2) DEFAULT 0,
        "real_expense" numeric(14,2) DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "lots" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "plan_id" BIGINT NOT NULL REFERENCES "plan"("id") ON DELETE CASCADE,
        "block_id" BIGINT REFERENCES "blocks"("id") ON DELETE SET NULL,
        "code" varchar(50) NOT NULL,
        "points" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "area_m2" numeric(12,2) DEFAULT 0,
        "price" numeric(14,2) DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'disponible' CHECK ("status" IN
          ('disponible','reservado','adelanto','primera_cuota','vendido')),
        "client_id" BIGINT REFERENCES "clients"("id") ON DELETE SET NULL,
        "agent_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("project_id","code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "lot_status_history" (
        "id" BIGSERIAL PRIMARY KEY,
        "lot_id" BIGINT NOT NULL REFERENCES "lots"("id") ON DELETE CASCADE,
        "from_status" varchar(20),
        "to_status" varchar(20) NOT NULL,
        "user_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "note" text,
        "amount" numeric(14,2),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "client_contacts" (
        "id" BIGSERIAL PRIMARY KEY,
        "client_id" BIGINT NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
        "user_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "lot_id" BIGINT NOT NULL REFERENCES "lots"("id") ON DELETE CASCADE,
        "client_id" BIGINT REFERENCES "clients"("id") ON DELETE SET NULL,
        "agent_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "sale_price" numeric(14,2) NOT NULL,
        "sale_date" date NOT NULL DEFAULT CURRENT_DATE,
        "commission" numeric(14,2) DEFAULT 0,
        "conditions" text,
        "status" varchar(20) NOT NULL DEFAULT 'cerrada',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "lot_id" BIGINT NOT NULL REFERENCES "lots"("id") ON DELETE CASCADE,
        "client_id" BIGINT REFERENCES "clients"("id") ON DELETE SET NULL,
        "agent_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "type" varchar(30) NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "due_date" date,
        "paid_at" timestamptz,
        "status" varchar(20) NOT NULL DEFAULT 'pendiente'
          CHECK ("status" IN ('pendiente','pagado','vencido')),
        "note" text,
        "created_by" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "financial_transactions" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT REFERENCES "projects"("id") ON DELETE SET NULL,
        "lot_id" BIGINT REFERENCES "lots"("id") ON DELETE SET NULL,
        "client_id" BIGINT REFERENCES "clients"("id") ON DELETE SET NULL,
        "campaign_id" BIGINT REFERENCES "campaigns"("id") ON DELETE SET NULL,
        "payment_id" BIGINT REFERENCES "payments"("id") ON DELETE SET NULL,
        "type" varchar(10) NOT NULL CHECK ("type" IN ('ingreso','egreso')),
        "category" varchar(80) NOT NULL,
        "concept" varchar(255) NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "txn_date" timestamptz NOT NULL DEFAULT now(),
        "created_by" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" BIGSERIAL PRIMARY KEY,
        "project_id" BIGINT REFERENCES "projects"("id") ON DELETE SET NULL,
        "campaign_id" BIGINT REFERENCES "campaigns"("id") ON DELETE SET NULL,
        "category" varchar(80) NOT NULL,
        "concept" varchar(255) NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "expense_date" date NOT NULL DEFAULT CURRENT_DATE,
        "created_by" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" BIGSERIAL PRIMARY KEY,
        "user_id" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
        "action" varchar(120) NOT NULL,
        "entity" varchar(60),
        "entity_id" bigint,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_lots_project" ON "lots"("project_id")`);
    await queryRunner.query(`CREATE INDEX "idx_lots_status" ON "lots"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_payments_lot" ON "payments"("lot_id")`);
    await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_txn_type_date" ON "financial_transactions"("type","txn_date")`);
    await queryRunner.query(`CREATE INDEX "idx_clients_agent" ON "clients"("agent_id")`);
    await queryRunner.query(`CREATE INDEX "idx_sales_agent" ON "sales"("agent_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "financial_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lot_status_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaigns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}