import React, { useContext } from 'react';
import { StudentContext } from '../contexts/StudentContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { UserIcon, PlusCircleIcon, ChevronDownIcon, LanguageIcon, WifiSlashIcon } from './icons/Icons';

const Header: React.FC = () => {
  const studentContext = useContext(StudentContext);
  const languageContext = useContext(LanguageContext);
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (!studentContext || !languageContext) {
    return null;
  }

  const { students, activeStudent, setActiveStudent, openStudentModal } = studentContext;
  const { language, setLanguage } = languageContext;
  
  const languages = [
      { code: 'ar', name: 'العربية' },
      { code: 'ku', name: 'Kurdî' },
      { code: 'en', name: 'English' },
  ];

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <svg className="w-10 h-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707.707M6.343 17.657l-.707.707m12.728 0l.707-.707M12 21v-1m0-16a8 8 0 100 16 8 8 0 000-16z" />
          </svg>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{t('appName')}</h1>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Offline Indicator */}
            {!isOnline && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full" title={t('offline_indicator')}>
                    <WifiSlashIcon className="w-4 h-4" />
                    <span>{t('offline_indicator')}</span>
                </div>
            )}
        
            {/* Language Switcher */}
            <div className="relative group inline-block">
                <button className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                    <LanguageIcon className="w-5 h-5" />
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
                <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible z-10">
                    <div className="py-1">
                        {languages.map(lang => (
                             <a
                                key={lang.code}
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setLanguage(lang.code as 'ar'|'en'|'ku');
                                }}
                                className={`block px-4 py-2 text-sm ${language === lang.code ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-slate-700`}
                              >
                                {lang.name}
                              </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Selector */}
            <div className="relative group inline-block">
                <button className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                {activeStudent ? (
                    <>
                    <UserIcon className="w-5 h-5" />
                    <span>{activeStudent.name}</span>
                    </>
                ) : (
                    <span>{t('selectStudent')}</span>
                )}
                <ChevronDownIcon className="w-4 h-4" />
                </button>
                <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible z-10">
                <div className="py-1">
                    {students.map((student) => (
                    <a
                        key={student.id}
                        href="#"
                        onClick={(e) => {
                        e.preventDefault();
                        setActiveStudent(student);
                        }}
                        className={`block px-4 py-2 text-sm ${activeStudent?.id === student.id ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-slate-700`}
                    >
                        {student.name}
                    </a>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        openStudentModal();
                    }}
                    className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                    <PlusCircleIcon className="w-5 h-5"/>
                    <span>{t('addNewStudent')}</span>
                    </a>
                </div>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;