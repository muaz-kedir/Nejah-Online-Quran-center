import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async ensureInitialUsers(): Promise<void> {
    await this.seedSuperAdmin();
    await this.seedDemoAccounts();
  }

  private async seedDemoAccounts() {
    const demoAccounts = [
      { email: 'admin@nejah.com', password: 'Admin123', name: 'Admin User', role: UserRole.ADMIN },
      {
        email: 'finance@nejah.com',
        password: 'Finance123',
        name: 'Finance Manager',
        role: UserRole.FINANCE_MANAGER,
      },
      {
        email: 'qirat@nejah.com',
        password: 'Qirat123',
        name: 'Qirat Manager',
        role: UserRole.QIRAT_MANAGER,
      },
      {
        email: 'teacher@nejah.com',
        password: 'Teacher123',
        name: 'Demo Teacher',
        role: UserRole.TEACHER,
      },
      {
        email: 'student@nejah.com',
        password: 'Student123',
        name: 'Demo Student',
        role: UserRole.STUDENT,
      },
      {
        email: 'parent@nejah.com',
        password: 'Parent123',
        name: 'Demo Parent',
        role: UserRole.PARENT,
      },
    ];

    for (const account of demoAccounts) {
      const existing = await this.findByEmail(account.email);
      if (!existing) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await this.usersRepository.save(
          this.usersRepository.create({
            ...account,
            password: hashedPassword,
            isActive: true,
          }),
        );
      }
    }
  }

  async seedSuperAdmin() {
    const superAdminEmail = 'nejahsuperadmin@gmail.com';
    const existingAdmin = await this.findByEmail(superAdminEmail);

    if (!existingAdmin) {
      try {
        const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
        const superAdmin = this.usersRepository.create({
          email: superAdminEmail,
          password: hashedPassword,
          name: 'Super Administrator',
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        });
        await this.usersRepository.save(superAdmin);
      } catch (error) {
        throw error;
      }
    } else {
      const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      existingAdmin.role = UserRole.SUPER_ADMIN;
      await this.usersRepository.save(existingAdmin);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(queryDto: QueryUserDto) {
    const { search, role, isActive, page = 1, limit = 10 } = queryDto;

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};

    if (search) {
      where['name'] = Like(`%${search}%`);
    }

    if (role) {
      where['role'] = role;
    }

    if (isActive !== undefined) {
      where['isActive'] = isActive;
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'name',
        'role',
        'phone',
        'avatar',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'role',
        'phone',
        'avatar',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'password',
        'name',
        'role',
        'phone',
        'avatar',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    const user = await this.findOne(id);

    // Prevent non-SUPER_ADMIN from modifying SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You cannot modify a SUPER_ADMIN user');
    }

    // Prevent ADMIN from creating or changing to SUPER_ADMIN
    if (updateUserDto.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN role');
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.findOne(id);

    // Prevent non-SUPER_ADMIN from deleting SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You cannot delete a SUPER_ADMIN user');
    }

    // Prevent users from deleting themselves
    if (user.id === currentUser.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.usersRepository.remove(user);
  }

  async toggleStatus(id: string, currentUser: User): Promise<User> {
    const user = await this.findOne(id);

    // Prevent non-SUPER_ADMIN from deactivating SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You cannot deactivate a SUPER_ADMIN user');
    }

    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
  }

  async getProfile(userId: string): Promise<User> {
    return this.findOne(userId);
  }

  async updateProfile(userId: string, updateDto: Partial<UpdateUserDto>): Promise<User> {
    const user = await this.findOne(userId);

    // Users cannot change their own role
    if (updateDto.role) {
      delete updateDto.role;
    }

    // Check email uniqueness if email is being updated
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    Object.assign(user, updateDto);
    return this.usersRepository.save(user);
  }

  async setPasswordResetToken(
    userId: string,
    hashedToken: string,
    expires: Date,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    });
  }

  async findByPasswordResetToken(hashedToken: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { passwordResetToken: hashedToken },
    });
  }

  async resetPasswordWithToken(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
}
