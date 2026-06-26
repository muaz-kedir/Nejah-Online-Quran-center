import { MigrationInterface, QueryRunner } from 'typeorm';

export class LiveSessionAttendanceReports1700000000008 implements MigrationInterface {
  name = 'LiveSessionAttendanceReports1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_segments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "userId" character varying NOT NULL,
        "userEmail" character varying NOT NULL,
        "userType" character varying NOT NULL,
        "zoomParticipantId" character varying,
        "joinTime" TIMESTAMP,
        "leaveTime" TIMESTAMP,
        "durationSeconds" integer NOT NULL DEFAULT 0,
        "source" character varying NOT NULL DEFAULT 'webhook',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_segments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_segments_sessionId"
      ON "attendance_segments" ("sessionId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_segments_sessionId_userEmail"
      ON "attendance_segments" ("sessionId", "userEmail")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session_participant_summaries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "userId" character varying NOT NULL,
        "userType" character varying NOT NULL,
        "participantId" character varying,
        "userName" character varying,
        "userEmail" character varying,
        "firstJoinTime" TIMESTAMP,
        "lastLeaveTime" TIMESTAMP,
        "totalDurationSeconds" integer NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'absent',
        "isReconciled" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_session_participant_summaries" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_session_participant_summaries_session_user"
      ON "session_participant_summaries" ("sessionId", "userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_participant_summaries_sessionId"
      ON "session_participant_summaries" ("sessionId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_participant_summaries_userType"
      ON "session_participant_summaries" ("sessionId", "userType")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'session_attendances_attendancestatus_enum'
          AND e.enumlabel = 'PARTIAL'
        ) THEN
          ALTER TYPE "session_attendances_attendancestatus_enum" ADD VALUE IF NOT EXISTS 'PARTIAL';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_session_participant_summaries_userType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_session_participant_summaries_sessionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_session_participant_summaries_session_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session_participant_summaries"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_segments_sessionId_userEmail"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_segments_sessionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_segments"`);
  }
}
