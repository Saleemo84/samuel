import React, { useState, useContext, useEffect } from 'react';
import type { VoiceLesson } from '../types';
import { StudentContext } from '../contexts/StudentContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import NoStudentSelected from './NoStudentSelected';
import { textToSpeech } from '../services/geminiService';
import { SpeakerWaveIcon, PlusCircleIcon, TrashIcon, BookOpenIcon, PauseIcon } from './icons/Icons';

const VoiceLessonsTab: React.FC = () => {
    const studentContext = useContext(StudentContext);
    const { language, t } = useTranslation();

    const [text, setText] = useState('');
    const [lessons, setLessons] = useState<VoiceLesson[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [speakingLessonId, setSpeakingLessonId] = useState<string | null>(null);

    const studentId = studentContext?.activeStudent?.id;
    const storageKey = `voice_lessons_${studentId}`;

    useEffect(() => {
        // Stop speech when component unmounts or student changes
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [studentId]);

    useEffect(() => {
        if (studentId) {
            try {
                const storedLessons = localStorage.getItem(storageKey);
                setLessons(storedLessons ? JSON.parse(storedLessons) : []);
            } catch (e) {
                console.error("Failed to load voice lessons from localStorage", e);
                setLessons([]);
            }
        } else {
            setLessons([]);
        }
    }, [studentId, storageKey]);

    const saveLessons = (updatedLessons: VoiceLesson[]) => {
        if (studentId) {
            localStorage.setItem(storageKey, JSON.stringify(updatedLessons));
        }
        setLessons(updatedLessons);
    };

    const handlePlay = (lessonText: string, lessonId: string) => {
        if (!lessonText.trim()) {
            setError(t('error_provide_lesson_text'));
            return;
        }
        setError(null);

        if (speakingLessonId === lessonId) {
            window.speechSynthesis.cancel();
            setSpeakingLessonId(null);
            return;
        }

        setSpeakingLessonId(lessonId);
        const langCode = language === 'ku' ? 'ku' : language === 'ar' ? 'ar-SA' : 'en-US';
        textToSpeech(lessonText, langCode, () => {
            setSpeakingLessonId(null);
        });
    };

    const handleSaveLesson = () => {
        if (!text.trim()) {
            setError(t('error_provide_lesson_text'));
            return;
        }
        setError(null);
        const newLesson: VoiceLesson = {
            id: Date.now().toString(),
            text: text.trim(),
            createdAt: new Date().toISOString()
        };
        const updatedLessons = [newLesson, ...lessons];
        saveLessons(updatedLessons);
        setText('');
    };

    const handleDeleteLesson = (lessonId: string) => {
        const updatedLessons = lessons.filter(l => l.id !== lessonId);
        saveLessons(updatedLessons);
    };

    if (!studentId) {
        return <NoStudentSelected />;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <SpeakerWaveIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" /> {t('voice_lesson_creator_title')}
                </h2>
                <p className="mb-4 text-gray-600 dark:text-gray-300">{t('voice_lesson_creator_description')}</p>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('voice_lesson_placeholder')}
                    className="w-full h-36 p-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700 transition"
                />
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                <div className="mt-4 flex flex-col sm:flex-row-reverse gap-3">
                     <button
                        onClick={handleSaveLesson}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
                    >
                        <PlusCircleIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        {t('save_lesson_button')}
                    </button>
                    <button
                        onClick={() => handlePlay(text, 'new_lesson')}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                    >
                        {speakingLessonId === 'new_lesson' ? (
                            <PauseIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        ) : (
                            <SpeakerWaveIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        )}
                        {t('generate_and_play_button')}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4">{t('saved_voice_lessons_title')}</h3>
                {lessons.length > 0 ? (
                    <ul className="space-y-3">
                        {lessons.map(lesson => (
                            <li key={lesson.id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <p className="flex-grow text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.text}</p>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
                                    <button onClick={() => handlePlay(lesson.text, lesson.id)} className="p-2 text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition" aria-label={t('play_lesson')}>
                                        {speakingLessonId === lesson.id ? <PauseIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition" aria-label={t('delete_lesson')}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('no_saved_lessons_title')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('no_saved_lessons_description')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceLessonsTab;