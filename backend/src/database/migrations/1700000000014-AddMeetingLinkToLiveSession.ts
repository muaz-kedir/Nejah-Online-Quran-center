import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetingLinkToLiveSession1700000000014 implements MigrationInterface {
  name = 'AddMeetingLinkToLiveSession1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "live_sessions"
      ADD COLUMN IF NOT EXISTS "meetingLink" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "live_sessions" DROP COLUMN IF EXISTS "meetingLink"`);
  }
}
