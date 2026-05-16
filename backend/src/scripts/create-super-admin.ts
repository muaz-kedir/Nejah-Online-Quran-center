import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';

async function createSuperAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const superAdminEmail = 'nejahsuperadmin@gmail.com';
    
    // Check if super admin already exists
    const existingAdmin = await usersService.findByEmail(superAdminEmail);
    
    if (existingAdmin) {
      console.log('Super Admin already exists!');
      console.log('Email:', superAdminEmail);
      await app.close();
      return;
    }

    // Create super admin
    const superAdmin = await usersService.create({
      email: superAdminEmail,
      password: 'SuperAdmin123',
      name: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });

    console.log('✅ Super Admin created successfully!');
    console.log('Email:', superAdminEmail);
    console.log('Password: SuperAdmin123');
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error creating Super Admin:', error);
  }

  await app.close();
}

createSuperAdmin();
