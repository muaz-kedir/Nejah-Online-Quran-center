import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeacherZoomConnectionFields1700000000005 implements MigrationInterface {
  name = 'TeacherZoomConnectionFields1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teachers"
      ADD COLUMN IF NOT EXISTS "zoomConnected" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "zoomEmail" varchar NULL,
      ADD COLUMN IF NOT EXISTS "zoomUserId" varchar NULL,
      ADD COLUMN IF NOT EXISTS "zoomConnectedAt" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teachers"
      DROP COLUMN IF EXISTS "zoomConnected",
      DROP COLUMN IF EXISTS "zoomEmail",
      DROP COLUMN IF EXISTS "zoomUserId",
      DROP COLUMN IF EXISTS "zoomConnectedAt"
    `);
  }
}
