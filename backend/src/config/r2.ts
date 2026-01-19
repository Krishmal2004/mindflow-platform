import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

// Helper to strip quotes and whitespace
const getEnv = (key: string, viteKey: string, expoKey: string) => {
    const val = process.env[key] || process.env[viteKey] || process.env[expoKey];
    return val ? val.replace(/["']/g, '').trim() : undefined;
};

const ACCOUNT_ID = getEnv('R2_ACCOUNT_ID', 'VITE_R2_ACCOUNT_ID', 'EXPO_PUBLIC_R2_ACCOUNT_ID');
const ACCESS_KEY_ID = getEnv('R2_ACCESS_KEY_ID', 'VITE_R2_ACCESS_KEY_ID', 'EXPO_PUBLIC_R2_ACCESS_KEY_ID');
const SECRET_ACCESS_KEY = getEnv('R2_SECRET_ACCESS_KEY', 'VITE_R2_SECRET_ACCESS_KEY', 'EXPO_PUBLIC_R2_SECRET_ACCESS_KEY');
const BUCKET_NAME = getEnv('R2_BUCKET_NAME', 'VITE_R2_BUCKET_NAME', 'EXPO_PUBLIC_R2_BUCKET_NAME');
export { BUCKET_NAME };  // Re-export explicitly

const PUBLIC_URL_BASE = getEnv('R2_PUBLIC_URL', 'VITE_R2_PUBLIC_URL', 'EXPO_PUBLIC_R2_PUBLIC_URL') || getEnv('PUBLIC_URL_BASE', 'VITE_PUBLIC_URL_BASE', 'EXPO_PUBLIC_PUBLIC_URL_BASE');
export { PUBLIC_URL_BASE }; // Re-export explicitly

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    console.error("CRITICAL: R2 Credentials missing in backend .env");
    console.log("Current Env Vars:", {
        R2_ACCOUNT_ID: ACCOUNT_ID ? '***' + ACCOUNT_ID.slice(-4) : 'MISSING',
        R2_BUCKET_NAME: BUCKET_NAME,
        PWD: process.cwd()
    });
}
console.log(`[R2] Initializing Client with Endpoint: https://${ACCOUNT_ID}.r2.cloudflarestorage.com`);

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID || '',
        secretAccessKey: SECRET_ACCESS_KEY || '',
    },
});
