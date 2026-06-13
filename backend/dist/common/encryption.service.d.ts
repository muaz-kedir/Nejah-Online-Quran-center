import { ConfigService } from '@nestjs/config';
export declare class EncryptionService {
    private readonly configService;
    private readonly logger;
    private readonly algorithm;
    private readonly key;
    constructor(configService: ConfigService);
    encrypt(text: string): string | null;
    decrypt(encryptedText: string): string | null;
}
