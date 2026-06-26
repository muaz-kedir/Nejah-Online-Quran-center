import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomFieldsToClassSession1718582400000 implements MigrationInterface {
  name = 'AddZoomFieldsToClassSession1718582400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "class_sessions"
      ADD COLUMN IF NOT EXISTS "zoomMeetingId" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "class_sessions"
      ADD COLUMN IF NOT EXISTS "zoomPassword" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "class_sessions" DROP COLUMN IF EXISTS "zoomPassword"`);
    await queryRunner.query(`ALTER TABLE "class_sessions" DROP COLUMN IF EXISTS "zoomMeetingId"`);
  }
}
