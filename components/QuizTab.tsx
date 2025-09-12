import React, { useState, useContext, useEffect } from 'react';
import type { Quiz } from '../types';
import { StudentContext } from '../contexts/StudentContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import NoStudentSelected from './NoStudentSelected';
import { generateQuiz } from '../services/geminiService';
import { QuestionMarkCircleIcon, PlusCircleIcon, SparklesIcon, BookOpenIcon, CheckIcon, XMarkIcon, TrashIcon } from './icons/Icons';
import LoadingSpinner from './LoadingSpinner';

type View = 'list' | 'create' | 'take' | 'results';

const QuizTab: React.FC = () => {
    const studentContext = useContext(StudentContext);
    const { language, t } = useTranslation();
    const isOnline = useOnlineStatus();
    const activeStudent = studentContext?.activeStudent;

    const [view, setView] = useState<View>('list');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [lessonText, setLessonText] = useState('');
    const [generatedQuiz, setGeneratedQuiz] = useState<Omit<Quiz, 'id' | 'createdAt'> | null>(null);
    const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const storageKey = activeStudent ? `quizzes_${activeStudent.id}` : null;

    useEffect(() => {
        if (storageKey) {
            try {
                const storedQuizzes = localStorage.getItem(storageKey);
                setQuizzes(storedQuizzes ? JSON.parse(storedQuizzes) : []);
            } catch (e) {
                console.error("Failed to load quizzes:", e);
                setQuizzes([]);
            }
        } else {
            setQuizzes([]);
        }
        // Reset view when student changes
        setView('list');
        setCurrentQuiz(null);
    }, [storageKey]);

    const saveQuizzes = (updatedQuizzes: Quiz[]) => {
        if (storageKey) {
            setQuizzes(updatedQuizzes);
            localStorage.setItem(storageKey, JSON.stringify(updatedQuizzes));
        }
    };

    const handleGenerateQuiz = async () => {
        if (!isOnline) {
            setError(t('offline_feature_disabled'));
            return;
        }
        if (!activeStudent) return;
        if (!lessonText.trim()) {
            setError(t('error_provide_lesson'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedQuiz(null);

        try {
            const result = await generateQuiz(lessonText, language, activeStudent.age, activeStudent.grade);
            setGeneratedQuiz(result);
        } catch (err) {
            const messageKey = err instanceof Error ? err.message : 'error_unexpected';
            setError(t(messageKey));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveQuiz = () => {
        if (!generatedQuiz) return;
        const newQuiz: Quiz = {
            ...generatedQuiz,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        saveQuizzes([newQuiz, ...quizzes]);
        setGeneratedQuiz(null);
        setLessonText('');
        setView('list');
    };
    
    const handleDeleteQuiz = (quizId: string) => {
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
        saveQuizzes(updatedQuizzes);
    };

    const handleStartQuiz = (quiz: Quiz) => {
        setCurrentQuiz(quiz);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedAnswer(null);
        setView('take');
    };

    const handleNextQuestion = () => {
        if (selectedAnswer === null || !currentQuiz) return;
        
        const updatedAnswers = [...userAnswers, selectedAnswer];
        setUserAnswers(updatedAnswers);
        setSelectedAnswer(null);

        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Finished quiz
            setView('results');
        }
    };
    
    if (!activeStudent) {
        return <NoStudentSelected />;
    }

    const renderQuizList = () => (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => { setView('create'); setError(null); setGeneratedQuiz(null); setLessonText(''); }}
                    className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
                >
                    <PlusCircleIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                    {t('create_new_quiz')}
                </button>
            </div>
            {quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col justify-between group">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{quiz.topic}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{quiz.questions.length} {t('questions')}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="mt-6 flex justify-between items-center">
                                <button onClick={() => handleStartQuiz(quiz)} className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm font-semibold">{t('take_quiz')}</button>
                                <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100" aria-label={t('delete_lesson')}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                    <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('no_quizzes_title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('no_quizzes_description')}</p>
                </div>
            )}
        </div>
    );
    
    const renderQuizCreator = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg space-y-6 max-w-4xl mx-auto">
            {!generatedQuiz ? (
                 <div>
                    <h2 className="text-2xl font-bold mb-4">{t('create_new_quiz')}</h2>
                    <textarea
                        value={lessonText}
                        onChange={(e) => setLessonText(e.target.value)}
                        placeholder={t('quiz_generation_prompt')}
                        className="w-full h-48 p-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700 transition"
                        disabled={isLoading}
                    />
                    <div className="mt-4 flex justify-between items-center">
                         <button onClick={() => setView('list')} className="text-sm text-gray-600 dark:text-gray-300 hover:underline">{t('cancel')}</button>
                         <button onClick={handleGenerateQuiz} disabled={isLoading || !isOnline} className="flex justify-center items-center px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-sky-300/50">
                            {isLoading ? <><LoadingSpinner />{t('loading_quiz')}</> : <><SparklesIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('generate_quiz_button')}</>}
                         </button>
                    </div>
                 </div>
            ) : (
                <div>
                    <h2 className="text-2xl font-bold mb-4">{t('review_and_save_quiz')}</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('quiz_topic')}</label>
                            <input type="text" value={generatedQuiz.topic} onChange={e => setGeneratedQuiz({...generatedQuiz, topic: e.target.value})}
                                   className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700"
                            />
                        </div>
                        {generatedQuiz.questions.map((q, qIndex) => (
                            <div key={qIndex} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                                <p className="font-semibold">{qIndex + 1}. {q.questionText}</p>
                                <ul className="mt-2 space-y-2">
                                    {q.answers.map((ans, aIndex) => (
                                        <li key={aIndex} className={`flex items-center space-x-2 rtl:space-x-reverse p-2 rounded ${ans.isCorrect ? 'bg-green-100 dark:bg-green-900/50' : ''}`}>
                                            {ans.isCorrect ? <CheckIcon className="w-5 h-5 text-green-600"/> : <XMarkIcon className="w-5 h-5 text-red-500 opacity-30"/>}
                                            <span className={`${ans.isCorrect ? 'font-bold text-green-800 dark:text-green-300' : 'text-gray-600 dark:text-gray-300'}`}>{ans.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                     <div className="mt-6 flex justify-between items-center">
                        <button onClick={() => setGeneratedQuiz(null)} className="text-sm text-gray-600 dark:text-gray-300 hover:underline">{t('cancel')}</button>
                        <button onClick={handleSaveQuiz} className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">{t('save_quiz_button')}</button>
                     </div>
                </div>
            )}
            {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        </div>
    );
    
    const renderQuizTaker = () => {
        if (!currentQuiz) return null;
        const question = currentQuiz.questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;

        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{currentQuiz.topic}</h2>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('question_of_total', {current: currentQuestionIndex + 1, total: currentQuiz.questions.length})}</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mb-6">
                    <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}></div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                    <p className="text-lg font-semibold">{question.questionText}</p>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.answers.map((answer, index) => (
                        <button key={index} onClick={() => setSelectedAnswer(index)}
                            className={`p-4 rounded-lg text-start transition-all border-2 ${selectedAnswer === index ? 'border-sky-500 bg-sky-100 dark:bg-sky-900/50' : 'border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                        >
                            {answer.text}
                        </button>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={handleNextQuestion} disabled={selectedAnswer === null} className="px-8 py-3 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-sky-300/50">
                        {isLastQuestion ? t('finish_quiz') : t('next_question')}
                    </button>
                </div>
            </div>
        );
    };

    const renderQuizResults = () => {
        if (!currentQuiz) return null;
        const score = userAnswers.reduce((acc, answerIndex, qIndex) => {
            return currentQuiz.questions[qIndex].answers[answerIndex]?.isCorrect ? acc + 1 : acc;
        }, 0);
        const total = currentQuiz.questions.length;

        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-center">{t('quiz_results_title')}</h2>
                    <p className="text-center mt-2 text-lg">{currentQuiz.topic}</p>
                    <div className="mt-6 text-center">
                        <p className="text-xl">{t('your_score')}</p>
                        <p className="text-6xl font-bold text-sky-600 dark:text-sky-400">{score} <span className="text-4xl text-gray-500 dark:text-gray-400">/ {total}</span></p>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentQuiz.questions.map((q, index) => {
                         const userAnswerIndex = userAnswers[index];
                         const isCorrect = q.answers[userAnswerIndex]?.isCorrect;
                         const correctAnswer = q.answers.find(a => a.isCorrect);
                         return (
                            <div key={index} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'}`}>
                                <p className="font-semibold">{q.questionText}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-sm">
                                        <span className="font-bold">{t('your_answer')}:</span> {q.answers[userAnswerIndex]?.text}
                                    </p>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isCorrect ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                                        {isCorrect ? t('correct_badge') : t('incorrect_badge')}
                                    </span>
                                </div>
                                {!isCorrect && correctAnswer && (
                                    <p className="mt-2 text-sm text-green-700 dark:text-green-300"><span className="font-bold">{t('correct_answer_is')}:</span> {correctAnswer.text}</p>
                                )}
                            </div>
                         );
                    })}
                </div>

                <div className="flex justify-center space-x-4 rtl:space-x-reverse pt-4">
                    <button onClick={() => setView('list')} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">{t('back_to_quizzes')}</button>
                    <button onClick={() => handleStartQuiz(currentQuiz)} className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">{t('retake_quiz')}</button>
                </div>
            </div>
        );
    };

    return (
         <div className="space-y-8">
            {view === 'list' && renderQuizList()}
            {view === 'create' && renderQuizCreator()}
            {view === 'take' && renderQuizTaker()}
            {view === 'results' && renderQuizResults()}
        </div>
    );
};

export default QuizTab;