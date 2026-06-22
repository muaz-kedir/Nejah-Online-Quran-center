import { MigrationInterface, QueryRunner } from 'typeorm';

export class ZoomServerToServerRefactor1700000000003 implements MigrationInterface {
  name = 'ZoomServerToServerRefactor1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "zoomMeetingUUID" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "session_attendances"
      ADD COLUMN IF NOT EXISTS "zoomRegistrantJoinUrl" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "session_attendances"
      ADD COLUMN IF NOT EXISTS "isReconciled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "participant_timeline_events"
      ADD COLUMN IF NOT EXISTS "source" character varying(20) NOT NULL DEFAULT 'webhook'
    `);

    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" DROP COLUMN IF EXISTS "accessToken"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" DROP COLUMN IF EXISTS "refreshToken"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" DROP COLUMN IF EXISTS "tokenExpiresAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" DROP COLUMN IF EXISTS "scope"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" ADD COLUMN IF NOT EXISTS "scope" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" ADD COLUMN IF NOT EXISTS "refreshToken" text
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations" ADD COLUMN IF NOT EXISTS "accessToken" text
    `);

    await queryRunner.query(`
      ALTER TABLE "participant_timeline_events" DROP COLUMN IF EXISTS "source"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_attendances" DROP COLUMN IF EXISTS "isReconciled"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_attendances" DROP COLUMN IF EXISTS "zoomRegistrantJoinUrl"
    `);
    await queryRunner.query(`
      ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "zoomMeetingUUID"
    `);
  }
}
