import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFcmTokens1700000000011 implements MigrationInterface {
  name = 'CreateFcmTokens1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fcm_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fcmToken" text NOT NULL,
        "deviceInfo" character varying,
        "platform" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fcm_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fcm_tokens_token" UNIQUE ("fcmToken")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fcm_tokens_userId"
      ON "fcm_tokens" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fcm_tokens"`);
  }
}
