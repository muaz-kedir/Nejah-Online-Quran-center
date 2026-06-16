import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClassroomSessionEnhancements1700000000001 implements MigrationInterface {
  name = 'ClassroomSessionEnhancements1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomPassword" VARCHAR(255) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "teacherJoinTime" TIMESTAMP NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "teacherLeaveTime" TIMESTAMP NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_sessions_scheduleId_scheduledStart"
      ON "live_sessions" ("scheduleId", "scheduledStart")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_sessions_scheduleId_scheduledStart"`);
    await queryRunner.query(`ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "teacherLeaveTime"`);
    await queryRunner.query(`ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "teacherJoinTime"`);
    await queryRunner.query(`ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "zoomPassword"`);
  }
}
