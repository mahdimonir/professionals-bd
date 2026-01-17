import { ApiResponse } from '../types';
import { api } from './api';

interface CloudinarySignature {
    timestamp: number;
    signature: string;
    cloudName: string;
    apiKey: string;
    folder: string;
    uploadPreset: string;
}

export class MediaService {
    // Get Cloudinary upload signature from backend
    static async getUploadSignature() {
        const response = await api.post<ApiResponse<CloudinarySignature>>('/media/signature', {});
        return response.data.data;
    }

    // Upload file directly to Cloudinary
    static async uploadToCloudinary(file: File): Promise<string> {
        try {
            // Step 1: Get signature from backend
            const signatureData = await this.getUploadSignature();

            // Step 2: Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('timestamp', signatureData.timestamp.toString());
            formData.append('signature', signatureData.signature);
            formData.append('api_key', signatureData.apiKey);
            formData.append('folder', signatureData.folder);
            formData.append('upload_preset', signatureData.uploadPreset);

            // Step 3: Upload directly to Cloudinary
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`;
            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Cloudinary upload failed');
            }

            const result = await response.json();
            return result.secure_url;
        } catch (err) {
            console.error('Upload error:', err);
            throw err;
        }
    }

    // Delete media from Cloudinary via backend
    static async deleteMedia(publicId: string) {
        const response = await api.post<ApiResponse<null>>('/media/delete', { publicId });
        return response.data;
    }

    // Helper: Create object URL for preview
    static createObjectURL(file: File): string {
        if (typeof window === 'undefined') return '';
        return URL.createObjectURL(file);
    }

    // Helper: Revoke object URL
    static revokeObjectURL(url: string) {
        if (typeof window === 'undefined') return;
        URL.revokeObjectURL(url);
    }

    // Validate image file type
    static validateImageFile(file: File): boolean {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    // Validate file size (default max 5MB)
    static validateFileSize(file: File, maxSizeMB: number = 5): boolean {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    }
}
