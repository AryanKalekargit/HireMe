import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo_cloud',
    api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'secret',
});

export async function uploadToCloudinary(fileBuffer: Buffer, fileName: string, folder = 'hireme_resumes'): Promise<{ url: string; publicId: string }> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const hasRealCloudinary =
        cloudName &&
        cloudName !== 'demo' &&
        cloudName !== 'demo_cloud' &&
        apiKey &&
        apiKey !== '1234567890' &&
        apiSecret &&
        !apiSecret.includes('sample') &&
        !apiSecret.includes('secret');

    if (hasRealCloudinary) {
        try {
            return await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'auto',
                        public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    },
                    (error, result) => {
                        if (error || !result) {
                            return reject(error || new Error('Cloudinary upload failed'));
                        }
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                        });
                    }
                );
                uploadStream.end(fileBuffer);
            });
        } catch (err) {
            console.warn('[HireMe] Cloudinary upload failed, falling back to local storage:', err);
        }
    }

    // Local development storage fallback
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);

    return {
        url: `/uploads/${safeFileName}`,
        publicId: safeFileName,
    };
}
