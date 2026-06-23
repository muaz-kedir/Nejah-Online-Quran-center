import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomColumnsToSession1700000000006 implements MigrationInterface {
  name = 'AddZoomColumnsToSession1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomMeetingId" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomMeetingUUID" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomJoinUrl" text
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomStartUrl" text
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomPassword" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ALTER COLUMN "zoomJoinUrl" TYPE text USING "zoomJoinUrl"::text
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ALTER COLUMN "zoomStartUrl" TYPE text USING "zoomStartUrl"::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ALTER COLUMN "zoomStartUrl" TYPE character varying USING "zoomStartUrl"::character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ALTER COLUMN "zoomJoinUrl" TYPE character varying USING "zoomJoinUrl"::character varying
    `);
  }
}
