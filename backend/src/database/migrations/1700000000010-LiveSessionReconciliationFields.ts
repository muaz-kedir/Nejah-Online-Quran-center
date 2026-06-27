import { MigrationInterface, QueryRunner } from 'typeorm';

export class LiveSessionReconciliationFields1700000000010 implements MigrationInterface {
  name = 'LiveSessionReconciliationFields1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "reconciliationStatus" character varying DEFAULT 'pending'
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "reconciliationAttempts" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "reconciliationAttempts"`);
    await queryRunner.query(`ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "reconciliationStatus"`);
  }
}
