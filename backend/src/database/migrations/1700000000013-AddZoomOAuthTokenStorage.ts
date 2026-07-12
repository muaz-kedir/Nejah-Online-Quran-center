import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomOAuthTokenStorage1700000000013 implements MigrationInterface {
  name = 'AddZoomOAuthTokenStorage1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      ADD COLUMN IF NOT EXISTS "accessTokenEncrypted" TEXT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      ADD COLUMN IF NOT EXISTS "refreshTokenEncrypted" TEXT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      DROP COLUMN IF EXISTS "accessTokenEncrypted"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      DROP COLUMN IF EXISTS "refreshTokenEncrypted"
    `);
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      DROP COLUMN IF EXISTS "tokenExpiresAt"
    `);
  }
}
