import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  // Alias for fullName
  get fullName(): string {
    return this.name;
  }

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  // Alias for profileImage
  get profileImage(): string {
    return this.avatar;
  }

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpires: Date;

  @Column({ default: false })
  notificationEnabled: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  notificationEnabledAt: Date;

  @Column({ default: false })
  telegramConnected: boolean;

  @Column({ nullable: true })
  telegramChatId: string;

  @Column({ nullable: true })
  telegramUsername: string;

  @Column({ default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
