import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ParentsService } from '../parents/parents.service';
import { StudentsService } from '../students/students.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private parentsService: ParentsService,
    private studentsService: StudentsService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      console.log('[AuthService] Starting registration process...');
      const { student, parent } = registerDto;

      // 1. Validate password confirmation
      if (student.password !== student.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // 2. Check if student email already exists
      console.log('[AuthService] Checking if student email exists:', student.email);
      const existingStudentUser = await this.usersService.findByEmail(student.email);
      if (existingStudentUser) {
        throw new ConflictException('Student email already registered');
      }

      // 3. Handle Parent logic
      console.log('[AuthService] Checking if parent email exists:', parent.email);
      let parentEntity = await this.parentsService.findByEmail(parent.email);
      let parentMessage = '';

      if (!parentEntity) {
        console.log('[AuthService] Creating new parent user...');
        // Create new parent user and profile
        const parentUser = await this.usersService.create({
          email: parent.email,
          password: 'TemporaryPassword123!', // Parents might need to reset this
          name: parent.fullName,
          role: UserRole.PARENT,
          phone: parent.phoneNumber,
        });
        console.log('[AuthService] Parent user created:', parentUser.id);

        console.log('[AuthService] Creating parent profile...');
        parentEntity = await this.parentsService.create({
          fullName: parent.fullName,
          email: parent.email,
          phoneNumber: parent.phoneNumber,
          residency: parent.residency,
          relationshipWithStudent: parent.relationshipWithStudent,
          user: parentUser,
        });
        console.log('[AuthService] Parent profile created:', parentEntity.id);
        parentMessage = 'New parent account created.';
      } else {
        console.log('[AuthService] Using existing parent:', parentEntity.id);
        parentMessage = 'Existing parent found. Student will be connected to the existing parent account.';
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
        gender: student.gender,
        age: student.age,
        currentResidency: student.residency,
        level: student.levelOfQuran,
        email: student.email,
        userId: studentUser.id,
        parentId: parentEntity.id,
        status: 'active',
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
    console.log(`[AuthService] Attempting login for email: ${loginDto.email}`);
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      console.log(`[AuthService] User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[AuthService] User found. ID: ${user.id}, Role: ${user.role}, IsActive: ${user.isActive}`);
    // Check if password exists on user object
    if (!user.password) {
      console.error(`[AuthService] CRITICAL: Password field is missing on user object from database!`);
    }

    console.log(`[AuthService] Stored Hash: ${user.password}`);
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
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
