"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const users_service_1 = require("../users/users.service");
const user_role_enum_1 = require("../common/enums/user-role.enum");
async function createSuperAdmin() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    try {
        const superAdminEmail = 'nejahsuperadmin@gmail.com';
        const existingAdmin = await usersService.findByEmail(superAdminEmail);
        if (existingAdmin) {
            console.log('Super Admin already exists!');
            console.log('Email:', superAdminEmail);
            await app.close();
            return;
        }
        const superAdmin = await usersService.create({
            email: superAdminEmail,
            password: 'SuperAdmin123',
            name: 'Super Administrator',
            role: user_role_enum_1.UserRole.SUPER_ADMIN,
            isActive: true,
        });
        console.log('✅ Super Admin created successfully!');
        console.log('Email:', superAdminEmail);
        console.log('Password: SuperAdmin123');
        console.log('⚠️  Please change the password after first login!');
    }
    catch (error) {
        console.error('Error creating Super Admin:', error);
    }
    await app.close();
}
createSuperAdmin();
//# sourceMappingURL=create-super-admin.js.map