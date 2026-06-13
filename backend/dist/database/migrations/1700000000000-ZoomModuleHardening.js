"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomModuleHardening1700000000000 = void 0;
class ZoomModuleHardening1700000000000 {
    constructor() {
        this.name = 'ZoomModuleHardening1700000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "session_attendances"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now()
    `);
        await queryRunner.query(`
      ALTER TABLE "students"
      ADD COLUMN IF NOT EXISTS "zoomEmail" VARCHAR(255) NULL
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "processed_webhooks" (
        "eventId" VARCHAR(255) NOT NULL,
        "processedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_processed_webhooks" PRIMARY KEY ("eventId")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_processed_webhooks_processedAt"
      ON "processed_webhooks" ("processedAt")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_sessions_teacherId_status"
      ON "live_sessions" ("teacherId", "status")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_sessions_status_scheduledStart"
      ON "live_sessions" ("status", "scheduledStart")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_attendances_sessionId_studentId"
      ON "session_attendances" ("sessionId", "studentId")
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_students_zoomEmail"
      ON "students" ("zoomEmail")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_zoomEmail"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_session_attendances_sessionId_studentId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_sessions_status_scheduledStart"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_sessions_teacherId_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_processed_webhooks_processedAt"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "processed_webhooks"`);
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN IF EXISTS "zoomEmail"`);
        await queryRunner.query(`ALTER TABLE "session_attendances" DROP COLUMN IF EXISTS "updatedAt"`);
    }
}
exports.ZoomModuleHardening1700000000000 = ZoomModuleHardening1700000000000;
//# sourceMappingURL=1700000000000-ZoomModuleHardening.js.map