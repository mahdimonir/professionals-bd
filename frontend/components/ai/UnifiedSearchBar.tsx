'use client';

import { useAuth } from '@/contexts/auth-context';
import { AIService } from '@/lib/services/ai-service';
import { ProfessionalService } from '@/lib/services/professional-service';
import { Loader2, Search, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface UnifiedSearchBarProps {
    onResults?: (professionals: any[]) => void;
    onLoading?: (loading: boolean) => void;
}

export default function UnifiedSearchBar({ onResults, onLoading }: UnifiedSearchBarProps) {
    const { user } = useAuth();
    
    // Only show for logged-in users - MUST be before other hooks
    if (!user) {
        return null;
    }

    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useAI, setUseAI] = useState(false);
    const [error, setError] = useState('');


    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        onLoading?.(true);
        setError('');

        try {
            if (useAI) {
                // AI-powered search
                const response = await AIService.smartSearch(query);
                onResults?.(response.data.professionals || []);
            } else {
                // Basic search
                const response = await ProfessionalService.getProfessionals({
                    search: query,
                    page: 1,
                    limit: 20
                });
                onResults?.(response.professionals || []);
            }
        } catch (err: any) {
            console.error('Search error:', err);
            
            if (err.response?.status === 429) {
                setError('Too many searches. Please try again in a minute.');
            } else if (err.response?.status === 401) {
                setError('Please log in to use AI search.');
                // Fallback to basic search
                if (useAI) {
                    setUseAI(false);
                    setTimeout(() => handleSearch(), 100);
                }
            } else {
                setError('Search failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
            onLoading?.(false);
        }
    };

    return (
        <div className="w-full">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
                <div className="relative flex items-center bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all">
                    <div className="absolute left-4 pointer-events-none">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        ) : useAI ? (
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        ) : (
                            <Search className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={useAI ? "Try: 'Corporate lawyer in Dhaka under ৳5000'" : "Search by name, specialty, or location..."}
                        className="flex-1 pl-12 pr-40 py-4 text-base bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isLoading}
                    />
                    
                    {/* AI Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setUseAI(!useAI)}
                        className={`absolute right-20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            useAI
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={useAI ? 'AI Search Active' : 'Use AI Search'}
                    >
                        {useAI ? '✨ AI' : 'AI'}
                    </button>
                    
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-24 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition mr-14"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
