import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { ParentsService } from '../parents/parents.service';
import { StudentsService } from '../students/students.service';
import { Student } from '../students/entities/student.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { Gender } from '../common/enums/gender.enum';
import { AgeRange, QuranLevel, StudentStatus } from '../students/entities/student.entity';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private parentsService: ParentsService,
    private studentsService: StudentsService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      console.log('[AuthService] Starting registration process...');
      const { student, parent, parentId } = registerDto;

      // 1. Validate password confirmations
      if (student.password !== student.confirmPassword) {
        throw new BadRequestException('Student passwords do not match');
      }
      if (student.ageRange === AgeRange.UNDER_18 && parent) {
        if (parent.password !== parent.confirmPassword) {
          throw new BadRequestException('Parent passwords do not match');
        }
      }

      // 2. Check if student email already exists
      console.log('[AuthService] Checking if student email exists:', student.email);
      const existingStudentUser = await this.usersService.findByEmail(student.email);
      if (existingStudentUser) {
        const existingProfile = await this.studentsRepository.findOne({
          where: { userId: existingStudentUser.id },
        });
        if (existingProfile) {
          throw new ConflictException(
            'A student with this email is already registered. Please log in instead.',
          );
        }
        if (existingStudentUser.role !== UserRole.STUDENT) {
          throw new ConflictException(
            `The student email "${student.email}" is already used by a ${this.roleLabel(existingStudentUser.role)} account. Please use a different email for the student.`,
          );
        }
      }

      // 3. Handle Parent logic
      let parentEntity = null;
      let parentMessage = 'Adult student, no parent linked.';

      if (student.ageRange === AgeRange.UNDER_18) {
        if (parentId) {
          // Existing parent selected via search: link only, never create.
          console.log('[AuthService] Linking to existing parent:', parentId);
          parentEntity = await this.parentsService.findOne(parentId);
          parentMessage = 'Student linked to the existing parent account.';
        } else {
          if (!parent) {
            throw new BadRequestException('Parent information is required for students under 18.');
          }

          console.log(
            '[AuthService] Resolving parent for registration:',
            parent.email,
            parent.phoneNumber,
          );
          const parentResult = await this.parentsService.findOrCreateForRegistration({
            fullName: parent.fullName,
            email: parent.email,
            phoneNumber: parent.phoneNumber,
            residency: parent.residency || parent.country || 'Not specified',
            country: parent.country,
            city: parent.city,
            relationshipWithStudent: parent.relationshipWithStudent,
            password: parent.password,
          });
          parentEntity = parentResult.parent;
          parentMessage = parentResult.message;
        }
        console.log('[AuthService] Parent resolved:', parentEntity.id, parentMessage);
      }

      // 4. Create Student logic
      let studentUser = existingStudentUser;
      if (!studentUser) {
        console.log('[AuthService] Creating student user...');
        studentUser = await this.usersService.create({
          email: student.email,
          password: student.password,
          name: student.fullName,
          role: UserRole.STUDENT,
        });
        console.log('[AuthService] Student user created:', studentUser.id);
      } else {
        console.log(
          '[AuthService] Reusing existing student user from prior attempt:',
          studentUser.id,
        );
      }

      console.log('[AuthService] Creating student profile...');
      const createdStudent = await this.studentsService.create({
        fullName: student.fullName,
        gender: student.gender.toLowerCase() === 'male' ? Gender.MALE : Gender.FEMALE,
        ageRange: student.ageRange,
        currentResidency: student.residency,
        country: student.country,
        city: student.city,
        phone: student.phone,
        level: student.levelOfQuran as QuranLevel,
        kitabRequested: student.kitabRequested,
        kitabName: student.kitabName,
        previousTraining: student.previousTraining,
        trainingDetails: student.trainingDetails,
        referralSource: student.referralSource,
        email: student.email,
        userId: studentUser.id,
        parentId: parentEntity ? parentEntity.id : null,
        status: StudentStatus.ACTIVE,
        attendanceRate: 0,
        progressRate: 0,
      });
      console.log('[AuthService] Student profile created successfully');

      // 5. Generate token for the student (since they just registered)
      const payload = { sub: studentUser.id, email: studentUser.email, role: studentUser.role };

      console.log('[AuthService] Registration completed successfully');
      return {
        message: 'Registration successful!',
        parentStatus: parentMessage,
        access_token: this.jwtService.sign(payload),
        user: {
          id: studentUser.id,
          email: studentUser.email,
          name: studentUser.name,
          role: studentUser.role,
          studentId: createdStudent.id,
        },
      };
    } catch (error) {
      console.error('[AuthService] Registration error:', error.message);
      console.error('[AuthService] Error stack:', error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email: identifier, password } = loginDto;
    console.log(`[AuthService] Attempting login for: ${identifier}`);

    try {
      let user = await this.usersService.findByEmail(identifier);

      // If no user found by email, try to find by student email/phone or teacher email
      if (!user) {
        // Try to find student by email or phone
        const student = await this.studentsRepository.findOne({
          where: [{ email: identifier }, { familyPhone: identifier }],
          relations: ['user'],
        });

        if (student?.userId) {
          try {
            user = await this.usersService.findOne(student.userId);
          } catch {
            throw new UnauthorizedException('Invalid credentials');
          }
        }
      }

      if (!user) {
        console.log(`[AuthService] User not found: ${identifier}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.password) {
        console.error(`[AuthService] User ${user.id} has no password hash stored`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`[AuthService] Password valid: ${isPasswordValid}`);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      const payload = { sub: user.id, email: user.email, role: user.role };

      const userResponse: {
        id: string;
        email: string;
        name: string;
        role: string;
        studentId?: string;
      } = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // Add studentId for student users
      if (user.role === UserRole.STUDENT) {
        const student = await this.studentsRepository.findOne({
          where: { userId: user.id },
        });
        if (student) {
          userResponse.studentId = student.id;
        }
      }

      console.log(`[AuthService] Login successful for user: ${user.email}, role: ${user.role}`);

      return {
        access_token: this.jwtService.sign(payload),
        user: userResponse,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        console.error('[AuthService] Database error during login:', error.message);
        throw new ServiceUnavailableException(
          'Database is still initializing. Wait a moment and try again.',
        );
      }
      console.error('[AuthService] Login failed:', error);
      throw error;
    }
  }

  private roleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'Admin',
      [UserRole.SUPER_ADMIN]: 'Admin',
      [UserRole.TEACHER]: 'Teacher',
      [UserRole.STUDENT]: 'Student',
      [UserRole.PARENT]: 'Parent',
      [UserRole.FINANCE_MANAGER]: 'Finance Manager',
      [UserRole.QIRAT_MANAGER]: 'Qirat Manager',
    };
    return labels[role] || role;
  }

  /**
   * Pre-registration availability check for the student email, so the form
   * can warn before submission instead of failing with a 409 at the end.
   */
  async checkStudentEmail(email: string) {
    const normalized = (email || '').trim();
    if (!normalized) {
      return { available: false, message: 'Email is required.' };
    }

    const existingUser = await this.usersService.findByEmail(normalized);
    if (!existingUser) {
      return { available: true, message: null };
    }

    if (existingUser.role !== UserRole.STUDENT) {
      return {
        available: false,
        message: `This email is already used by a ${this.roleLabel(existingUser.role)} account. Please use a different email for the student.`,
      };
    }

    const existingProfile = await this.studentsRepository.findOne({
      where: { userId: existingUser.id },
    });
    if (existingProfile) {
      return {
        available: false,
        message: 'A student with this email is already registered. Please log in instead.',
      };
    }

    // Student user without a profile (incomplete prior attempt): register() reuses it.
    return { available: true, message: null };
  }

  /** Strip a parent record down to what the public registration flow may see. */
  private toParentSearchResult(parent: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    students?: unknown[];
  }) {
    return {
      id: parent.id,
      fullName: parent.fullName,
      email: parent.email,
      phoneNumber: parent.phoneNumber || null,
      childrenCount: parent.students?.length || 0,
    };
  }

  /**
   * Registration-time parent search: partial name match, exact email/phone match.
   * Returns a limited projection (no addresses, no user data).
   */
  async lookupParentsForRegistration(query: string) {
    const trimmed = (query || '').trim();
    if (trimmed.length < 3) {
      return [];
    }

    const results = new Map<string, any>();

    const byEmail = await this.parentsService.findByEmail(trimmed.toLowerCase());
    if (byEmail) results.set(byEmail.id, byEmail);

    const byPhone = await this.parentsService.findByPhone(trimmed);
    if (byPhone) results.set(byPhone.id, byPhone);

    // Partial name (and partial email/phone) search.
    const matches = await this.parentsService.search(trimmed);
    for (const match of matches) {
      results.set(match.id, match);
    }

    return Array.from(results.values()).map((p) => this.toParentSearchResult(p));
  }

  /**
   * Duplicate detection for the "create new parent" path: exact email or
   * phone match against existing parent records.
   */
  async checkParentDuplicate(email?: string, phoneNumber?: string) {
    let match = null;

    if (email?.trim()) {
      match = await this.parentsService.findByEmail(email.trim().toLowerCase());
    }
    if (!match && phoneNumber?.trim()) {
      match = await this.parentsService.findByPhone(phoneNumber.trim());
    }

    if (match) {
      return {
        exists: true,
        parent: this.toParentSearchResult(match),
        conflict: false,
        message: null,
      };
    }

    // No parent record, but the email may already belong to a non-parent user,
    // which would make registration fail with a 409 later. Flag it now.
    if (email?.trim()) {
      const existingUser = await this.usersService.findByEmail(email.trim());
      if (existingUser && existingUser.role !== UserRole.PARENT) {
        return {
          exists: false,
          parent: null,
          conflict: true,
          message: `This email is already used by a ${this.roleLabel(existingUser.role)} account. Please use a different email for the parent.`,
        };
      }
    }

    return { exists: false, parent: null, conflict: false, message: null };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findUserByEmailForPasswordReset(email);
    if (!user) {
      return;
    }

    const tempPassword = crypto.randomBytes(9).toString('base64url');

    await this.usersService.resetPasswordWithToken(user.id, tempPassword);

    const logger = new Logger('ForgotPassword');
    logger.log(`═══════════════════════════════════════════════════════`);
    logger.log(`  NEW PASSWORD for ${user.email} (${user.name}):`);
    logger.log(`  ┌──────────────────────────────────────────────┐`);
    logger.log(`  │  ${tempPassword.padEnd(38)}│`);
    logger.log(`  └──────────────────────────────────────────────┘`);
    logger.log(`  Copy this password and use it to log in.`);
    logger.log(`═══════════════════════════════════════════════════════`);

    await this.emailService.sendNewPasswordEmail(user.email, user.name, tempPassword);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        'Reset link is invalid or has expired. Please request a new one.',
      );
    }

    if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset link has expired. Please request a new one.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }

    await this.usersService.resetPasswordWithToken(user.id, newPassword);

    await this.emailService.sendPasswordChangedConfirmation(user.email, user.name);
  }

  async validateResetToken(rawToken: string): Promise<boolean> {
    if (!rawToken) {
      return false;
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user || !user.passwordResetExpires) {
      return false;
    }

    return new Date() <= user.passwordResetExpires;
  }

  private async findUserByEmailForPasswordReset(email: string): Promise<User | null> {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const student = await this.studentsRepository.findOne({
        where: { email },
        relations: ['user'],
      });
      if (student?.userId) {
        user = await this.usersService.findOne(student.userId);
      }
    }

    return user;
  }

  async validateUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
