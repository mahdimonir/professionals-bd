'use client';

import { useAuth } from '@/contexts/auth-context';
import { AIService } from '@/lib/services/ai-service';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    error?: boolean;
}

export default function AIChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);



    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            type: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null); // Changed from '' to null to match useState type

        try {
            const response = await AIService.query(input.trim());
            
            const aiMessage: Message = {
                type: 'ai',
                content: response.data.response, // Assuming response.data contains a 'response' field
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err: any) {
            // Reverted to original error handling logic to avoid breaking changes
            // based on the provided instruction's context.
            console.error('AI query failed:', err);
            
            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            
            if (err.response?.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Please log in to use the AI assistant.';
            } else if (typeof window !== 'undefined' && !navigator.onLine) {
                errorMessage = 'No internet connection. Please check your network.';
            } else if ((err as any).code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again.';
            }

            setError(errorMessage);

            // Add error message
setMessages((prev) => [
                ...prev,
                {
                    type: 'ai',
                    content: errorMessage,
                    timestamp: new Date(),
                    error: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    return (
        <>
            {/* Floating Button - Hidden when chat is open */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
                    aria-label="Open AI Assistant"
                >
                    {isLoading ? (
                        <svg className="w-7 h-7 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    )}
                    {!isOpen && messages.length === 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>
            )}

            {/* Only render for logged-in users */}
            {!user ? null : (
            <>
            {/* Chat Widget with Backdrop - Proper positioning for desktop and mobile */}
            {isOpen && (
                <>
                    {/* Backdrop - Click to close (only on desktop) */}
                    <div 
                        className="hidden sm:block fixed inset-0 bg-black/20 z-20"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                    />
                    
                    {/* Chat Widget */}
                    <div className="fixed inset-0 pt-16 sm:pt-0 sm:inset-auto sm:top-20 sm:bottom-auto sm:right-6 sm:w-96 sm:h-[600px] bg-white dark:bg-gray-900 sm:rounded-xl shadow-2xl flex flex-col z-30 border-0 sm:border border-gray-200 dark:border-gray-700">
                    {/* Header - Mobile friendly close button */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-5 sm:rounded-t-xl flex justify-between items-center shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">ProBD AI</h3>
                                <p className="text-xs opacity-90 flex items-center">
                                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            {messages.length > 0 && (
                                <button onClick={clearChat} className="hover:bg-white/20 rounded p-2.5 sm:p-2 transition" title="Clear chat">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            {/* Larger close button for mobile */}
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-2.5 sm:p-2 transition" aria-label="Close chat">
                                <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages - flex-1 to take available space */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-8 sm:mt-12">
                                <div className="mb-6">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                                        <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-base font-semibold mb-2">How can I help you today?</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">I can help you with:</p>
                                <div className="space-y-2 max-w-xs mx-auto">
                                    <button onClick={() => setInput("Show me my bookings")} className="w-full text-left px-4 py-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm">
                                        📅 Your bookings
                                    </button>
                                    <button onClick={() => setInput("Find lawyers in Dhaka")} className="w-full text-left px-4 py-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm">
                                        🔍 Find professionals
                                    </button>
                                    <button onClick={() => setInput("What are my earnings?")} className="w-full text-left px-4 py-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm">
                                        💰 Your earnings
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                                        msg.type === 'user'
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                            : msg.error
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md'
                                    }`}
                                >
                                    {msg.type === 'ai' ? (
                                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:mt-0 prose-p:mb-2 prose-headings:mt-2 prose-headings:mb-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                    )}
                                    <p className="text-xs mt-1 opacity-70">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start animate-fadeIn">
                                <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-md">
                                    <div className="flex space-x-2">
                                        <div className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Questions - Show after conversation starts */}
                        {messages.length > 0 && !isLoading && (
                            <div className="pt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Quick questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setInput("Show me my bookings")}
                                        className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    >
                                        📅 My bookings
                                    </button>
                                    <button
                                        onClick={() => setInput("Find lawyers in Dhaka")}
                                        className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    >
                                        🔍 Find lawyers
                                    </button>
                                    <button
                                        onClick={() => setInput("How do I book a consultation?")}
                                        className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    >
                                        ❓ How to book
                                    </button>
                                    <button
                                        onClick={() => setInput("What payment methods do you accept?")}
                                        className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                                    >
                                        💳 Payment methods
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Fixed height, no overlap */}
                    <div className="shrink-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
                        {error && (
                            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-start">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="font-semibold">Error</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSend} className="flex items-end space-x-2">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask me anything..."
                                    className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition max-h-32"
                                    rows={1}
                                    style={{ minHeight: '48px' }}
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {isLoading ? (
                                    <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </form>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                            Powered by Gemini AI • Press Enter to send
                        </p>
                    </div>
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            </>
            )}
        </>
    );
}
