import React, { useState, useContext, useRef } from 'react';
import { StudentContext } from '../contexts/StudentContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { generateLessonAnalysis, searchVideos, textToSpeech } from '../services/geminiService';
import type { LessonAnalysis, VideoResult } from '../types';
import MindMap from './MindMap';
import { SparklesIcon, DocumentTextIcon, PhotoIcon, SpeakerWaveIcon, VideoCameraIcon, XCircleIcon, LinkIcon } from './icons/Icons';
import NoStudentSelected from './NoStudentSelected';
import LoadingSpinner from './LoadingSpinner';
import VoiceNotes from './VoiceNotes';
import { fetchUrlContent } from '../utils/urlFetcher';
import { optimizeImage } from '../utils/imageOptimizer';

type InputType = 'text' | 'image' | 'url';

const LessonTab: React.FC = () => {
    const [inputType, setInputType] = useState<InputType>('text');
    const [lessonText, setLessonText] = useState('');
    const [lessonUrl, setLessonUrl] = useState('');
    const [lessonImage, setLessonImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<LessonAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessageKey, setLoadingMessageKey] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const studentContext = useContext(StudentContext);
    const { language, t } = useContext(LanguageContext);
    const isOnline = useOnlineStatus();
    const activeStudent = studentContext?.activeStudent;

    const handleRemoveImage = () => {
        setLessonImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleInputTypeChange = (type: InputType) => {
        setInputType(type);
        setError(null);
        // Clear other inputs when switching
        if (type !== 'text') setLessonText('');
        if (type !== 'image') handleRemoveImage();
        if (type !== 'url') setLessonUrl('');
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLessonImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!isOnline) {
            setError(t('offline_feature_disabled'));
            return;
        }

        const isInputMissing =
            (inputType === 'text' && !lessonText) ||
            (inputType === 'image' && !lessonImage) ||
            (inputType === 'url' && !lessonUrl);

        if (isInputMissing) {
            let errorKey = 'error_provide_lesson';
            if (inputType === 'url') errorKey = 'error_provide_url';
            setError(t(errorKey));
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setVideos([]);
        setLoadingMessageKey('');


        try {
            let content: string | File;

            if (inputType === 'image' && lessonImage) {
                setLoadingMessageKey('loading_processing_image');
                content = await optimizeImage(lessonImage);
            } else if (inputType === 'url') {
                setLoadingMessageKey('loading_fetching_url');
                content = await fetchUrlContent(lessonUrl);
            } else {
                content = lessonText;
            }

            setLoadingMessageKey('loading_ai_analysis');
            const result = await generateLessonAnalysis(
                content,
                language,
                activeStudent?.age,
                activeStudent?.grade
            );
            setAnalysis(result);
            if (result.keywords && result.keywords.length > 0) {
                const videoResults = await searchVideos(
                    result.keywords,
                    language,
                    activeStudent?.age
                );
                setVideos(videoResults);
            }
        } catch (err) {
            const messageKey = err instanceof Error ? err.message : 'error_unexpected';
            setError(t(messageKey));
            console.error(err);
        } finally {
            setIsLoading(false);
            setLoadingMessageKey('');
        }
    };
    
    const langCodeForSpeech = language === 'ku' ? 'ku' : language === 'ar' ? 'ar-SA' : 'en-US';
    
    const inputTypes: {id: InputType, icon: React.FC<{className?: string}>, label: string}[] = [
        { id: 'text', icon: DocumentTextIcon, label: t('lesson_input_type_text') },
        { id: 'image', icon: PhotoIcon, label: t('lesson_input_type_image') },
        { id: 'url', icon: LinkIcon, label: t('lesson_input_type_url') },
    ];


    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center"><SparklesIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" /> {t('lesson_details_title')}</h2>
                
                <div className="mb-4 flex border border-gray-300 dark:border-slate-600 rounded-lg p-1 space-x-1 rtl:space-x-reverse bg-gray-100 dark:bg-slate-900">
                    {inputTypes.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => handleInputTypeChange(id)}
                            className={`w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                inputType === id 
                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                <div className="min-h-[12rem] flex flex-col justify-center">
                    {inputType === 'text' && (
                        <textarea
                            value={lessonText}
                            onChange={(e) => setLessonText(e.target.value)}
                            placeholder={t('lesson_text_placeholder')}
                            className="w-full h-48 p-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700 transition"
                            disabled={isLoading}
                        />
                    )}
                    {inputType === 'url' && (
                         <div className="relative">
                            <span className="absolute inset-y-0 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none">
                                <LinkIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input
                                type="url"
                                value={lessonUrl}
                                onChange={e => setLessonUrl(e.target.value)}
                                placeholder={t('lesson_url_placeholder')}
                                className="w-full ltr:pl-10 rtl:pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700 transition"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    {inputType === 'image' && (
                        imagePreview ? (
                            <div className="relative">
                                <img src={imagePreview} alt={t('lesson_image_preview_alt')} className="w-full h-48 object-contain rounded-md border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700" />
                                <button onClick={handleRemoveImage} disabled={isLoading} className="absolute top-2 ltr:right-2 rtl:left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition disabled:opacity-50">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`w-full h-48 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md ${isLoading ? 'cursor-not-allowed bg-gray-100 dark:bg-slate-800' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                onClick={() => !isLoading && fileInputRef.current?.click()}
                            >
                                <div className="space-y-1 text-center">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('lesson_image_upload_prompt')}</p>
                                </div>
                                <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} disabled={isLoading} />
                            </div>
                        )
                    )}
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !isOnline}
                        title={!isOnline ? t('offline_feature_disabled') : ''}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300/50 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? <><LoadingSpinner /> {t(loadingMessageKey) || t('loading_analysis')}...</> : <><SparklesIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('analyze_button')}</>}
                    </button>
                </div>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
            </div>

            {isLoading && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                    <div className="inline-flex items-center">
                        <LoadingSpinner />
                        <p className="text-lg ltr:ml-3 rtl:mr-3">{t(loadingMessageKey) || t('loading_analysis')}</p>
                    </div>
                </div>
            )}

            {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><DocumentTextIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" />{t('explanation_title')}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{analysis.explanation}</p>
                        <button onClick={() => textToSpeech(analysis.explanation, langCodeForSpeech)} className="mt-4 flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                            <SpeakerWaveIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('listen_button')}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4">{t('mindmap_title')}</h3>
                        <MindMap node={analysis.mindMap} />
                    </div>

                    {videos.length > 0 && (
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 flex items-center"><VideoCameraIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" /> {t('videos_title')}</h3>
                            <ul className="space-y-3">
                                {videos.map((video, index) => (
                                    <li key={index}>
                                        <a href={video.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 rtl:space-x-reverse text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition">
                                            <VideoCameraIcon className="w-5 h-5"/>
                                            <span className="underline">{video.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {activeStudent && (
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                            <VoiceNotes 
                                lessonTopic={analysis.mindMap.title} 
                                studentId={activeStudent.id} 
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LessonTab;