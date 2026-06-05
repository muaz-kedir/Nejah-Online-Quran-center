import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('teacher_application_settings')
export class TeacherApplicationSettings {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ default: false })
  isApplicationsOpen: boolean;
}
