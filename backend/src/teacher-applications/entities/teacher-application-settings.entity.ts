import { Entity, Column, PrimaryColumn } from 'typeorm';

export type AnnouncementText = {
  en: string;
  ar: string;
  am: string;
};

@Entity('teacher_application_settings')
export class TeacherApplicationSettings {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ default: false })
  isApplicationsOpen: boolean;

  @Column({ type: 'json', nullable: true })
  announcementText: AnnouncementText | null;
}
