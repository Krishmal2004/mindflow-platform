import { S3Client } from '@aws-sdk/client-s3';

const ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
export const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
export const PUBLIC_URL_BASE = import.meta.env.VITE_R2_PUBLIC_URL;

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
});
