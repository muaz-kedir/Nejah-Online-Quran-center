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
var EncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let EncryptionService = EncryptionService_1 = class EncryptionService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EncryptionService_1.name);
        this.algorithm = 'aes-256-gcm';
        const secret = this.configService.get('ENCRYPTION_KEY');
        if (!secret) {
            this.logger.warn('ENCRYPTION_KEY not set — tokens will be stored in plaintext');
            this.key = null;
        }
        else {
            this.key = crypto.scryptSync(secret, 'salt', 32);
        }
    }
    encrypt(text) {
        if (!this.key || !text)
            return text || null;
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }
    decrypt(encryptedText) {
        if (!this.key || !encryptedText)
            return encryptedText || null;
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3)
                return encryptedText;
            const [ivHex, authTagHex, dataHex] = parts;
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(ivHex, 'hex'));
            decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(dataHex, 'hex')),
                decipher.final(),
            ]);
            return decrypted.toString('utf8');
        }
        catch {
            this.logger.error('Failed to decrypt token — key may have changed');
            return null;
        }
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = EncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map