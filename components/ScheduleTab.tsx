import React, { useState, useContext } from 'react';
import type { ScheduleItem } from '../types';
import { generateSchedule } from '../services/geminiService';
import { StudentContext } from '../contexts/StudentContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { CalendarDaysIcon, SparklesIcon, BookOpenIcon, PuzzlePieceIcon, UserIcon, SunIcon, MoonIcon, ClockIcon } from './icons/Icons';
import NoStudentSelected from './NoStudentSelected';
import LoadingSpinner from './LoadingSpinner';

const ScheduleTab: React.FC = () => {
    const [preferences, setPreferences] = useState('');
    const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const studentContext = useContext(StudentContext);
    const { language } = useContext(LanguageContext);
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();

    const handleSubmit = async () => {
        if (!isOnline) {
            setError(t('offline_feature_disabled'));
            return;
        }
        if (!studentContext?.activeStudent) {
            setError(t('error_select_student'));
            return;
        }
        if (!preferences) {
            setError(t('error_provide_preferences'));
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setSchedule(null);

        try {
            const result = await generateSchedule(preferences, studentContext.activeStudent.age, language);
            setSchedule(result);
        } catch (err) {
            const messageKey = err instanceof Error ? err.message : 'error_unexpected';
            setError(t(messageKey));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName.toLowerCase()) {
            case 'book-open': return <BookOpenIcon className="w-6 h-6 text-sky-500" />;
            case 'puzzle-piece': return <PuzzlePieceIcon className="w-6 h-6 text-green-500" />;
            case 'user': return <UserIcon className="w-6 h-6 text-yellow-500" />;
            case 'sun': return <SunIcon className="w-6 h-6 text-orange-500" />;
            case 'moon': return <MoonIcon className="w-6 h-6 text-indigo-500" />;
            case 'clock': return <ClockIcon className="w-6 h-6 text-gray-500" />;
            default: return <ClockIcon className="w-6 h-6 text-gray-500" />;
        }
    };
    
    if (!studentContext?.activeStudent) {
        return <NoStudentSelected />;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center"><CalendarDaysIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" /> {t('schedule_title')}</h2>
                <p className="mb-4 text-gray-600 dark:text-gray-300">{t('schedule_description')}</p>
                <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder={t('schedule_placeholder')}
                    className="w-full h-28 p-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700 transition"
                />
                <div className="mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !isOnline}
                        title={!isOnline ? t('offline_feature_disabled') : ''}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300/50 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? <><LoadingSpinner /> {t('loading_schedule')}...</> : <><SparklesIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" /> {t('create_schedule_button')}</>}
                    </button>
                </div>
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
            </div>

            {isLoading && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg text-center">
                    <LoadingSpinner />
                    <p className="mt-2 text-lg">{t('loading_schedule_message')}</p>
                </div>
            )}

            {schedule && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4">{t('schedule_suggestion_title')}</h3>
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {schedule.map((item, index) => (
                                <li key={index}>
                                    <div className="relative pb-8">
                                        {index !== schedule.length - 1 ? (
                                            <span className="absolute top-4 ltr:left-4 rtl:right-4 ltr:-ml-px rtl:-mr-px h-full w-0.5 bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex items-center space-x-3 rtl:space-x-reverse">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center ring-8 ring-white dark:ring-slate-800">
                                                   {getIcon(item.icon)}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{item.activity}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleTab;