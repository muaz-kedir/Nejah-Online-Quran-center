import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveZoomS2sOAuthColumns1700000000012 implements MigrationInterface {
  name = 'RemoveZoomS2sOAuthColumns1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      DROP COLUMN IF EXISTS "accountId"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      DROP COLUMN IF EXISTS "clientId"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      DROP COLUMN IF EXISTS "clientSecretEncrypted"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      DROP COLUMN IF EXISTS "clientSecret"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      ADD COLUMN IF NOT EXISTS "accountId" VARCHAR NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      ADD COLUMN IF NOT EXISTS "clientId" VARCHAR NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      ADD COLUMN IF NOT EXISTS "clientSecretEncrypted" TEXT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_platform_config"
      ADD COLUMN IF NOT EXISTS "clientSecret" TEXT NULL
    `);
  }
}
