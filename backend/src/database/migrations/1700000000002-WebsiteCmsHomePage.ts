import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebsiteCmsHomePage1700000000002 implements MigrationInterface {
  name = 'WebsiteCmsHomePage1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "home_mission_sections" (
        "id" VARCHAR NOT NULL DEFAULT 'default',
        "aboutHeader" jsonb NOT NULL DEFAULT '{}',
        "aboutDescription" jsonb NOT NULL DEFAULT '{}',
        "missionTitle" jsonb NOT NULL DEFAULT '{}',
        "missionHeading" jsonb NOT NULL DEFAULT '{}',
        "missionDescription" jsonb NOT NULL DEFAULT '{}',
        "missionImageUrl" VARCHAR NULL,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_home_mission_sections" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "home_mission_cards" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" jsonb NOT NULL DEFAULT '{}',
        "description" jsonb NOT NULL DEFAULT '{}',
        "iconUrl" VARCHAR NULL,
        "displayOrder" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_home_mission_cards" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "home_programs_sections" (
        "id" VARCHAR NOT NULL DEFAULT 'default',
        "sectionHeader" jsonb NOT NULL DEFAULT '{}',
        "mainTitle" jsonb NOT NULL DEFAULT '{}',
        "description" jsonb NOT NULL DEFAULT '{}',
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_home_programs_sections" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "home_programs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "level" jsonb NOT NULL DEFAULT '{}',
        "title" jsonb NOT NULL DEFAULT '{}',
        "description" jsonb NOT NULL DEFAULT '{}',
        "imageUrl" VARCHAR NULL,
        "displayOrder" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_home_programs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_home_mission_cards_displayOrder"
      ON "home_mission_cards" ("displayOrder")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_home_programs_displayOrder"
      ON "home_programs" ("displayOrder")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_home_programs_displayOrder"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_home_mission_cards_displayOrder"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "home_programs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "home_programs_sections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "home_mission_cards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "home_mission_sections"`);
  }
}
