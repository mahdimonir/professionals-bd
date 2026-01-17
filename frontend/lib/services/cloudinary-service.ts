import axios from 'axios';
import { api } from './api';

interface CloudinarySignatureResponse {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
}

interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    resource_type: string;
}

export const CloudinaryService = {
    /**
     * Upload a file to Cloudinary using a signed request from the backend.
     * @param file The file to upload.
     * @param folder The folder to upload to (e.g., 'avatars', 'documents').
     */
    async uploadFile(file: File, folder: string): Promise<CloudinaryUploadResult> {
        try {
            // 1. Get Signature from Backend
            const signatureRes = await api.post<CloudinarySignatureResponse>('/media/signature', {
                folder,
            });

            const { signature, timestamp, cloudName, apiKey } = signatureRes.data;

            // 2. Prepare FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', folder);

            // 3. Upload to Cloudinary
            const uploadRes = await axios.post<CloudinaryUploadResult>(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            return uploadRes.data;
        } catch (error) {
            console.error('Cloudinary upload failed:', error);
            throw error;
        }
    },
};
