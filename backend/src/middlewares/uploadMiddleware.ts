import multer from 'multer';

const ALLOWED_AUDIO_MIMES = new Set([
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mpeg',
    'audio/mp4',
    'audio/webm',
    'audio/ogg',
    'application/octet-stream',
]);

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        const ext = (file.originalname || '').toLowerCase();
        const extOk = /\.(wav|mp3|m4a|webm|ogg)$/.test(ext);
        if (ALLOWED_AUDIO_MIMES.has(mime) || extOk) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files (wav, mp3, m4a, webm, ogg) are allowed'));
        }
    },
});
