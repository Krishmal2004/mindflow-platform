import multer from 'multer';

// Configure Multer to store files in memory as Buffers
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
});
