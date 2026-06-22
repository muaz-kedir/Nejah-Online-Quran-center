import { MigrationInterface, QueryRunner } from 'typeorm';

export class ZoomPlatformPlainSecret1700000000004 implements MigrationInterface {
  name = 'ZoomPlatformPlainSecret1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      ADD COLUMN IF NOT EXISTS "clientSecret" TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      DROP COLUMN IF EXISTS "clientSecret"
    `);
  }
}
