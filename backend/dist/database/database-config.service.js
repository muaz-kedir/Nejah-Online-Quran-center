"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DatabaseConfigService = class DatabaseConfigService {
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        const host = this.configService.get('DB_HOST', 'localhost');
        const port = this.configService.get('DB_PORT', 5432);
        const username = this.configService.get('DB_USERNAME', 'postgres');
        const password = this.configService.get('DB_PASSWORD', 'password');
        const database = this.configService.get('DB_NAME', 'nejah_db');
        return {
            type: 'postgres',
            host,
            port,
            username,
            password,
            database,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: this.configService.get('NODE_ENV') === 'development',
            logging: this.configService.get('NODE_ENV') === 'development'
                ? ['error', 'warn', 'schema']
                : false,
            autoLoadEntities: true,
            url: this.configService.get('DATABASE_URL'),
            ssl: false,
        };
    }
};
exports.DatabaseConfigService = DatabaseConfigService;
exports.DatabaseConfigService = DatabaseConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseConfigService);
//# sourceMappingURL=database-config.service.js.map