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
    const { student, parent } = registerDto;

    // 1. Validate password confirmation
    if (student.password !== student.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // 2. Check if student email already exists
    const existingStudentUser = await this.usersService.findByEmail(student.email);
    if (existingStudentUser) {
      throw new ConflictException('Student email already registered');
    }

    // 3. Handle Parent logic
    let parentEntity = await this.parentsService.findByEmail(parent.email);
    let parentMessage = '';

    if (!parentEntity) {
      // Create new parent user and profile
      const parentUser = await this.usersService.create({
        email: parent.email,
        password: 'TemporaryPassword123!', // Parents might need to reset this
        name: parent.fullName,
        role: UserRole.PARENT,
      });

      parentEntity = await this.parentsService.create({
        fullName: parent.fullName,
        email: parent.email,
        residency: parent.residency,
        relationshipWithStudent: parent.relationshipWithStudent,
        user: parentUser,
      });
      parentMessage = 'New parent account created.';
    } else {
      parentMessage = 'Existing parent found. Student will be connected to the existing parent account.';
    }

    // 4. Create Student logic
    const studentUser = await this.usersService.create({
      email: student.email,
      password: student.password,
      name: student.fullName,
      role: UserRole.STUDENT,
    });

    const studentEntity = await this.studentsService.create({
      fullName: student.fullName,
      gender: student.gender,
      age: student.age,
      residency: student.residency,
      levelOfQuran: student.levelOfQuran,
      email: student.email,
      user: studentUser,
      parent: parentEntity,
    });

    // 5. Generate token for the student (since they just registered)
    const payload = { sub: studentUser.id, email: studentUser.email, role: studentUser.role };
    
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
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

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
