import React, { useState, useContext, useEffect, useRef } from 'react';
import { Content } from "@google/genai";
import { StudentContext } from '../contexts/StudentContext';
import { LanguageContext } from '../contexts/LanguageContext';
import NoStudentSelected from './NoStudentSelected';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTranslation } from '../hooks/useTranslation';
import { generateChatResponse } from '../services/geminiService';
import { optimizeImage } from '../utils/imageOptimizer';
import { UserIcon, PaperClipIcon, PaperAirplaneIcon, XCircleIcon } from './icons/Icons';
import LoadingSpinner from './LoadingSpinner';

const ChatTab: React.FC = () => {
    const studentContext = useContext(StudentContext);
    const { language, t } = useContext(LanguageContext);
    const isOnline = useOnlineStatus();

    const [messages, setMessages] = useState<Content[]>([]);
    const [inputText, setInputText] = useState('');
    const [inputImage, setInputImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const activeStudent = studentContext?.activeStudent;
    const storageKey = activeStudent ? `chat_history_${activeStudent.id}` : null;

    useEffect(() => {
        if (storageKey) {
            try {
                const storedHistory = localStorage.getItem(storageKey);
                setMessages(storedHistory ? JSON.parse(storedHistory) : []);
            } catch (e) {
                console.error("Failed to load chat history:", e);
                setMessages([]);
            }
        } else {
            setMessages([]);
        }
    }, [storageKey]);

    useEffect(() => {
        if (storageKey && messages.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, storageKey]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInputImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setInputImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOnline) {
            setError(t('offline_feature_disabled'));
            return;
        }
        if (!activeStudent) {
            setError(t('error_select_student'));
            return;
        }
        if (!inputText.trim() && !inputImage) {
            return;
        }

        setIsLoading(true);
        setError(null);

        const userParts: { text?: string; inlineData?: any }[] = [];
        if (inputText.trim()) {
            userParts.push({ text: inputText.trim() });
        }
        
        let optimizedImageFile = null;
        if (inputImage) {
            try {
                optimizedImageFile = await optimizeImage(inputImage);
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(optimizedImageFile!);
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = error => reject(error);
                });
                userParts.push({
                    inlineData: {
                        mimeType: optimizedImageFile.type,
                        data: base64,
                    },
                });
            } catch (err) {
                console.error("Image optimization/processing failed:", err);
                setError(t('error_file_read'));
                setIsLoading(false);
                return;
            }
        }
        
        const userMessage: Content = { role: 'user', parts: userParts };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText('');
        removeImage();

        try {
            const responseText = await generateChatResponse(
                updatedMessages,
                { text: inputText, image: optimizedImageFile || undefined },
                activeStudent.age,
                activeStudent.grade,
                language
            );
            const modelMessage: Content = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            const messageKey = err instanceof Error ? err.message : 'error_unexpected';
            setError(t(messageKey));
            setMessages(prev => prev.slice(0, -1)); // Remove the user message if API fails
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeStudent) {
        return <NoStudentSelected />;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-18rem)] bg-white dark:bg-slate-800 rounded-lg shadow-lg">
            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                    <div className="text-center h-full flex flex-col justify-center items-center text-gray-500 dark:text-gray-400">
                        <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center mb-4">
                           <svg className="w-10 h-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707.707M6.343 17.657l-.707.707m12.728 0l.707-.707M12 21v-1m0-16a8 8 0 100 16 8 8 0 000-16z" />
                           </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('chat_welcome_title')}</h2>
                        <p className="max-w-sm mt-2 text-sm">{t('chat_welcome_description')}</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white shrink-0 text-sm font-bold">AI</div>
                            )}
                            <div className={`max-w-lg lg:max-w-2xl w-auto rounded-2xl p-4 ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                {msg.parts.map((part, partIndex) => {
                                    if (part.text) {
                                        return <p key={partIndex} className="whitespace-pre-wrap">{part.text}</p>;
                                    }
                                    if (part.inlineData) {
                                        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                                        return <img key={partIndex} src={imageUrl} alt="User upload" className="mt-2 rounded-lg max-w-xs" />;
                                    }
                                    return null;
                                })}
                            </div>
                             {msg.role === 'user' && (
                                <UserIcon className="w-8 h-8 text-gray-400 bg-gray-100 dark:bg-slate-700 p-1.5 rounded-full shrink-0" />
                            )}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex items-end gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white shrink-0 text-sm font-bold">AI</div>
                         <div className="max-w-lg rounded-2xl p-4 bg-gray-100 dark:bg-slate-700 rounded-bl-none">
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse [animation-delay:-0.15s] mx-1"></div>
                                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                {error && <p className="mb-2 text-red-500 text-center text-sm">{error}</p>}
                {imagePreview && (
                    <div className="relative inline-block mb-2">
                        <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg" />
                        <button onClick={removeImage} title={t('remove_image')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition">
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} className="sr-only" accept="image/*" onChange={handleImageChange} disabled={isLoading || !isOnline} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading || !isOnline} className="p-2 text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400 transition rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50">
                        <PaperClipIcon className="w-6 h-6" />
                    </button>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder={!isOnline ? t('offline_feature_disabled') : t('chat_placeholder')}
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-full focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-900 transition resize-none"
                        rows={1}
                        disabled={isLoading || !isOnline}
                    />
                    <button type="submit" disabled={isLoading || !isOnline} className="p-3 text-white bg-sky-600 rounded-full hover:bg-sky-700 disabled:bg-sky-300/50 disabled:cursor-not-allowed transition">
                         {isLoading ? <div className="w-6 h-6"><LoadingSpinner /></div> : <PaperAirplaneIcon className="w-6 h-6" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatTab;