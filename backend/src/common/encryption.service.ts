import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secret) {
      this.logger.warn('ENCRYPTION_KEY not set — tokens will be stored in plaintext');
      this.key = null;
    } else {
      this.key = crypto.scryptSync(secret, 'salt', 32);
    }
  }

  encrypt(text: string): string | null {
    if (!this.key || !text) return text || null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encryptedText: string): string | null {
    if (!this.key || !encryptedText) return encryptedText || null;
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;
      const [ivHex, authTagHex, dataHex] = parts;
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataHex, 'hex')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      this.logger.error('Failed to decrypt token — key may have changed');
      return null;
    }
  }
}
