import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    await usersService.ensureInitialUsers();
    console.log('Demo accounts seeded successfully');
    console.log('');
    console.log('Credentials:');
    console.log('  Super Admin     nejahsuperadmin@gmail.com / SuperAdmin123');
    console.log('  Admin           admin@nejah.com / Admin123');
    console.log('  Finance Manager  finance@nejah.com / Finance123');
    console.log('  Qirat Manager    qirat@nejah.com / Qirat123');
    console.log('  Teacher         teacher@nejah.com / Teacher123');
    console.log('  Student         student@nejah.com / Student123');
    console.log('  Parent          parent@nejah.com / Parent123');
    console.log('');
    console.log('Change passwords after first login!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }

  await app.close();
}

seed();
