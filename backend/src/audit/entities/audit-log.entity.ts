import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  userRole: string;

  @Column()
  method: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  resource: string;

  @Column({ nullable: true })
  action: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'jsonb', nullable: true })
  requestBody: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: Record<string, unknown>;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
