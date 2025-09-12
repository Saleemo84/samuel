import React, { useState, useMemo, useContext, useEffect } from 'react';
import type { Student, Tab } from './types';
import { StudentContext } from './contexts/StudentContext';
import { LanguageContext } from './contexts/LanguageContext';
import Header from './components/Header';
import StudentModal from './components/StudentModal';
import LessonTab from './components/LessonTab';
import ScheduleTab from './components/ScheduleTab';
import BooksTab from './components/BooksTab';
import VoiceLessonsTab from './components/VoiceLessonsTab';
import ChatTab from './components/ChatTab';
import GameTab from './components/GameTab';
import QuizTab from './components/QuizTab';
import useStudents from './hooks/useStudents';
import { TABS } from './constants';
import { useTranslation } from './hooks/useTranslation';
import { ChatBubbleLeftRightIcon, DocumentTextIcon, CalendarDaysIcon, BookOpenIcon, SpeakerWaveIcon, PuzzlePieceIcon, QuestionMarkCircleIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const { students, activeStudent, setActiveStudent, addStudent } = useStudents();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();

  useEffect(() => {
    const dir = language === 'ar' || language === 'ku' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const contextValue = useMemo(() => ({
    students,
    activeStudent,
    setActiveStudent,
    addStudent,
    openStudentModal: () => setIsModalOpen(true)
  }), [students, activeStudent, setActiveStudent, addStudent]);
  
  const getTabIcon = (tabId: Tab) => {
    switch (tabId) {
        case 'chat': return <ChatBubbleLeftRightIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        case 'lesson': return <DocumentTextIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        case 'schedule': return <CalendarDaysIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        case 'books': return <BookOpenIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        case 'voice_lessons': return <SpeakerWaveIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        case 'games': return <PuzzlePieceIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        case 'quiz': return <QuestionMarkCircleIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />;
        default: return null;
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatTab />;
      case 'lesson':
        return <LessonTab />;
      case 'schedule':
        return <ScheduleTab />;
      case 'books':
        return <BooksTab />;
      case 'voice_lessons':
        return <VoiceLessonsTab />;
      case 'games':
        return <GameTab />;
      case 'quiz':
        return <QuizTab />;
      default:
        return <ChatTab />;
    }
  };

  return (
    <StudentContext.Provider value={contextValue}>
      <div className="min-h-screen bg-sky-50 text-gray-800 dark:bg-slate-900 dark:text-gray-200 transition-colors duration-300">
        <Header />
        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-4 space-x-reverse overflow-x-auto" aria-label="Tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                    } flex items-center whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-all`}
                  >
                    {getTabIcon(tab.id)}
                    {t(tab.id)}
                  </button>
                ))}
              </nav>
            </div>

            {renderTabContent()}
          </div>
        </main>
        <footer className="text-center p-4 text-xs text-gray-500 dark:text-gray-400">
          <p>{t('footer_developed_by')}</p>
          <p>&copy; {new Date().getFullYear()} {t('appName')}. {t('footer_rights_reserved')}</p>
        </footer>
        <StudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </StudentContext.Provider>
  );
};

export default App;