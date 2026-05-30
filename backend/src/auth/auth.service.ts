import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ParentsService } from '../parents/parents.service';
import { StudentsService } from '../students/students.service';
import { Student } from '../students/entities/student.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { Gender } from '../common/enums/gender.enum';
import { AgeRange, QuranLevel, StudentStatus } from '../students/entities/student.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private parentsService: ParentsService,
    private studentsService: StudentsService,
    private jwtService: JwtService,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      console.log('[AuthService] Starting registration process...');
      const { student, parent } = registerDto;

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
        throw new ConflictException('Student email already registered');
      }

      // 3. Handle Parent logic
      let parentEntity = null;
      let parentMessage = 'Adult student, no parent linked.';

      if (student.ageRange === AgeRange.UNDER_18) {
        if (!parent) {
          throw new BadRequestException('Parent information is required for students under 18.');
        }

        console.log('[AuthService] Checking if parent email or phone exists:', parent.email, parent.phoneNumber);
        const existingByEmail = await this.parentsService.findByEmail(parent.email);
        const existingByPhone = parent.phoneNumber ? await this.parentsService['parentsRepository'].findOne({ where: { phoneNumber: parent.phoneNumber } }) : null;
        
        parentEntity = existingByEmail || existingByPhone;

        if (!parentEntity) {
          console.log('[AuthService] Creating new parent profile and user...');
          parentEntity = await this.parentsService.create({
            fullName: parent.fullName,
            email: parent.email,
            phoneNumber: parent.phoneNumber,
            residency: parent.residency,
            country: parent.country,
            city: parent.city,
            relationshipWithStudent: parent.relationshipWithStudent,
            password: parent.password,
          });
          console.log('[AuthService] Parent profile and user created:', parentEntity.id);
          parentMessage = 'New parent account created.';
        } else {
          console.log('[AuthService] Using existing parent:', parentEntity.id);
          parentMessage = 'Existing parent found. Student will be connected to the existing parent account.';
        }
      }

      // 4. Create Student logic
      console.log('[AuthService] Creating student user...');
      const studentUser = await this.usersService.create({
        email: student.email,
        password: student.password,
        name: student.fullName,
        role: UserRole.STUDENT,
      });
      console.log('[AuthService] Student user created:', studentUser.id);

      console.log('[AuthService] Creating student profile...');
      await this.studentsService.create({
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

    let user = await this.usersService.findByEmail(identifier);

    if (!user) {
      const student = await this.studentsRepository.findOne({
        where: [
          { email: identifier },
          { familyPhone: identifier },
        ],
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

    console.log(`[AuthService] User found. ID: ${user.id}, Role: ${user.role}, IsActive: ${user.isActive}`);
    if (!user.password) {
      console.error(`[AuthService] CRITICAL: Password field is missing on user object from database!`);
    }

    console.log(`[AuthService] Stored Hash: ${user.password}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`[AuthService] Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists, but the user specifically asked for "automatically they get the password"
      // In a production app, we'd say "If an account exists, a link has been sent"
      throw new BadRequestException('User with this email does not exist');
    }

    // Mock sending email
    console.log(`Sending password reset link to ${email}`);
    
    return {
      message: 'Password recovery instructions have been sent to your email.',
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
