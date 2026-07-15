import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnboardingFieldsToUsers1700000000012 implements MigrationInterface {
  name = 'AddOnboardingFieldsToUsers1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "notificationEnabled" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "notificationEnabledAt" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "telegramConnected" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "telegramChatId" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "telegramUsername" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "onboardingCompleted"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegramUsername"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegramChatId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegramConnected"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "notificationEnabledAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "notificationEnabled"`);
  }
}
