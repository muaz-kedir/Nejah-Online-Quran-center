import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddZoomFieldsToClassSession1718582400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add zoomMeetingId column
    await queryRunner.addColumn(
      'class_sessions',
      new TableColumn({
        name: 'zoomMeetingId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add zoomPassword column
    await queryRunner.addColumn(
      'class_sessions',
      new TableColumn({
        name: 'zoomPassword',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('class_sessions', 'zoomPassword');
    await queryRunner.dropColumn('class_sessions', 'zoomMeetingId');
  }
}
