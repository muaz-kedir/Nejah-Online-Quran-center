import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushSubscriptions1700000000007 implements MigrationInterface {
  name = 'CreatePushSubscriptions1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "userType" character varying,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "expiresAt" TIMESTAMP,
        "deviceInfo" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "push_subscriptions"
      ADD COLUMN IF NOT EXISTS "userType" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "push_subscriptions"
      ADD COLUMN IF NOT EXISTS "deviceInfo" character varying
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_push_subscriptions_userId"
      ON "push_subscriptions" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_push_subscriptions_userType"
      ON "push_subscriptions" ("userType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_subscriptions_userType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_subscriptions_userId"`);
    await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP COLUMN IF EXISTS "deviceInfo"`);
    await queryRunner.query(`ALTER TABLE "push_subscriptions" DROP COLUMN IF EXISTS "userType"`);
  }
}
