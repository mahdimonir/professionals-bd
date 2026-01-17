import { ApiResponse } from '@/lib/types';
import { api } from './api';

export interface AIQueryRequest {
    query: string;
}

export interface AIQueryResponse {
    response: string;
}

export interface SmartSearchResult {
    professionals: any[];
    searchParams: {
        category?: string;
        specialties?: string[];
        location?: string;
        minRate?: number;
        maxRate?: number;
        languages?: string[];
        minExperience?: number;
    };
}

export interface AIChatMessage {
    id: string;
    query: string;
    response: string;
    contextType?: string;
    createdAt: string;
}

export class AIService {
    // Main AI assistant query with database context
    static async query(userQuery: string) {
        const response = await api.post<ApiResponse<AIQueryResponse>>('/ai/query', {
            query: userQuery,
        });
        return response.data;
    }

    // Smart natural language search
    static async smartSearch(query: string) {
        const response = await api.post<ApiResponse<SmartSearchResult>>('/ai/search', {
            query,
        });
        return response.data;
    }

    // Get chat history
    static async getChatHistory(limit: number = 20) {
        const response = await api.get<ApiResponse<AIChatMessage[]>>(`/ai/history?limit=${limit}`);
        return response.data;
    }

    // Check if AI feature is enabled
    static async getFeatureStatus(featureName: string) {
        const response = await api.get<ApiResponse<{ featureName: string; enabled: boolean }>>(
            `/ai/features/${featureName}`
        );
        return response.data;
    }
}
