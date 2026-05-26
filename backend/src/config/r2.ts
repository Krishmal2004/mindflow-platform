import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

/** Reads env var with fallbacks for legacy VITE/EXPO prefixes. */
const getEnv = (key: string): string | undefined => {
    const val = process.env[key] || process.env[`VITE_${key}`] || process.env[`EXPO_PUBLIC_${key}`];
    return val?.replace(/["']/g, '').trim();
};

const ACCOUNT_ID = getEnv('R2_ACCOUNT_ID');
const ACCESS_KEY_ID = getEnv('R2_ACCESS_KEY_ID');
const SECRET_ACCESS_KEY = getEnv('R2_SECRET_ACCESS_KEY');
const BUCKET_NAME = getEnv('R2_BUCKET_NAME');
const PUBLIC_URL_BASE = getEnv('R2_PUBLIC_URL') || getEnv('PUBLIC_URL_BASE');

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    console.error('[R2] CRITICAL: One or more R2 credentials are missing.');
}

export { BUCKET_NAME, PUBLIC_URL_BASE };

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID || '',
        secretAccessKey: SECRET_ACCESS_KEY || '',
    },
});
