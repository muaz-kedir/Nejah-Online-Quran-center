"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const path_1 = require("path");
const env_validation_1 = require("./config/env-validation");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    (0, env_validation_1.validateEnvironment)(logger);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                return callback(null, true);
            }
            const configuredOrigin = configService.get('CORS_ORIGIN');
            if (configuredOrigin && origin === configuredOrigin) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads' });
    const port = configService.get('PORT') || 3000;
    try {
        const dataSource = app.get(typeorm_1.DataSource);
        if (dataSource.isInitialized) {
            console.log('✅ Database connected');
        }
        await app.listen(port);
        console.log(`🚀 Nejah Backend API is running on: http://localhost:${port}/api`);
    }
    catch (err) {
        if (err?.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Stop the other process or set PORT to a different value.`);
        }
        throw err;
    }
}
bootstrap();
//# sourceMappingURL=main.js.map