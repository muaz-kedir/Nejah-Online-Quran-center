"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
const REQUIRED_ZOOM_VARS = ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'];
const RECOMMENDED_VARS = ['ZOOM_SECRET_TOKEN', 'ENCRYPTION_KEY'];
function validateEnvironment(logger) {
    const missing = [];
    for (const key of REQUIRED_ZOOM_VARS) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
    for (const key of RECOMMENDED_VARS) {
        if (!process.env[key]) {
            logger.warn(`Recommended environment variable ${key} is not set`);
        }
    }
}
//# sourceMappingURL=env-validation.js.map