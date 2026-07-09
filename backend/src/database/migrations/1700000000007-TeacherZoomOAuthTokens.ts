import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeacherZoomOAuthTokens1700000000007 implements MigrationInterface {
  name = 'TeacherZoomOAuthTokens1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      ADD COLUMN IF NOT EXISTS "accessTokenEncrypted" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "refreshTokenEncrypted" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "zoom_integrations"
      DROP COLUMN IF EXISTS "accessTokenEncrypted",
      DROP COLUMN IF EXISTS "refreshTokenEncrypted",
      DROP COLUMN IF EXISTS "tokenExpiresAt"
    `);
  }
}
