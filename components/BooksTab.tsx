import React, { useState, useEffect, useMemo } from 'react';
import type { Book } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { BookOpenIcon, TrashIcon, UploadIcon, DocumentIcon, MagnifyingGlassIcon, FunnelIcon, XCircleIcon, AcademicCapIcon, DocumentTextIcon } from './icons/Icons';

const AddBookModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (file: File, grade: number, subject: string) => void;
}> = ({ isOpen, onClose, onAdd }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [grade, setGrade] = useState(1);
    const [subject, setSubject] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !subject) {
            setError(t('error_all_fields_required'));
            return;
        }
        onAdd(file, grade, subject);
        handleClose();
    };
    
    const handleClose = () => {
        setFile(null);
        setGrade(1);
        setSubject('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">{t('add_book_title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('book_file')}</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none">
                                        <span>{t('upload_a_file')}</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*,application/pdf" />
                                    </label>
                                    <p className="ltr:pl-1 rtl:pr-1">{t('or_drag_and_drop')}</p>
                                </div>
                                {file ? <p className="text-xs text-gray-500">{file.name}</p> : <p className="text-xs text-gray-500">{t('pdf_or_image_up_to_10mb')}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('book_grade')}</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
                                <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input type="number" id="grade" value={grade} onChange={(e) => setGrade(parseInt(e.target.value))} min="1" max="12" className="w-full ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700" required />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('book_subject')}</label>
                         <div className="relative">
                            <span className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
                                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('subject_placeholder')} className="w-full ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700" required />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div className="flex justify-end space-x-4 rtl:space-x-reverse pt-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 transition">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition">{t('add_book_button')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const BooksTab: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterGrade, setFilterGrade] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const storageKey = 'books_library';

    useEffect(() => {
        try {
            const storedBooks = localStorage.getItem(storageKey);
            if (storedBooks) {
                setBooks(JSON.parse(storedBooks));
            } else {
                setBooks([]);
            }
        } catch (error) {
            console.error("Failed to load books from localStorage", error);
            setBooks([]);
        }
        setSearchTerm(''); 
        setFilterGrade('all');
        setFilterSubject('all');
    }, []);

    const saveBooks = (updatedBooks: Book[]) => {
        localStorage.setItem(storageKey, JSON.stringify(updatedBooks));
    };

    const handleAddBook = (file: File, grade: number, subject: string) => {
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const newBook: Book = {
                id: Date.now().toString(),
                name: file.name,
                dataUrl,
                type: file.type,
                grade,
                subject,
            };
            const updatedBooks = [...books, newBook];
            setBooks(updatedBooks);
            saveBooks(updatedBooks);
        };
        reader.onerror = () => {
            setError(t('error_file_read'));
            console.error("FileReader error: Failed to read the file.");
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteBook = (bookId: string) => {
        const updatedBooks = books.filter(book => book.id !== bookId);
        setBooks(updatedBooks);
        saveBooks(updatedBooks);
    };

    const { groupedBooks, uniqueGrades, uniqueSubjects } = useMemo(() => {
        const filtered = books
            .filter(book => book.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(book => filterGrade === 'all' || book.grade === parseInt(filterGrade))
            .filter(book => filterSubject === 'all' || book.subject === filterSubject);

        const grouped = filtered.reduce((acc, book) => {
            const gradeKey = `grade_${book.grade}`;
            if (!acc[gradeKey]) {
                acc[gradeKey] = { grade: book.grade, subjects: {} };
            }
            if (!acc[gradeKey].subjects[book.subject]) {
                acc[gradeKey].subjects[book.subject] = [];
            }
            acc[gradeKey].subjects[book.subject].push(book);
            return acc;
        }, {} as Record<string, { grade: number; subjects: Record<string, Book[]> }>);
        
        const sortedGrades = Object.values(grouped).sort((a, b) => a.grade - b.grade);
        
        const allGrades = [...new Set(books.map(b => b.grade))].sort((a,b) => a-b);
        const relevantSubjects = [...new Set(books.filter(b => filterGrade === 'all' || b.grade === parseInt(filterGrade)).map(b => b.subject))];

        return { groupedBooks: sortedGrades, uniqueGrades: allGrades, uniqueSubjects: relevantSubjects };
    }, [books, searchTerm, filterGrade, filterSubject]);

    const hasFilters = filterGrade !== 'all' || filterSubject !== 'all' || searchTerm !== '';
    const hasBooks = books.length > 0;
    const hasResults = groupedBooks.length > 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center shrink-0">
                    <BookOpenIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" />
                    {t('books_title')}
                </h2>
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
                     <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
                    >
                        <UploadIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        {t('add_book_button')}
                    </button>
                </div>
            </div>
            
             {hasBooks && (
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="relative w-full lg:col-span-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('search_books_placeholder')}</label>
                             <span className="absolute bottom-2 ltr:left-0 rtl:right-0 flex items-center ltr:pl-3 rtl:pr-3 pointer-events-none">
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            </span>
                            <input type="text" placeholder={t('search_books_by_name')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full mt-1 ltr:pl-10 rtl:pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 transition"
                            />
                        </div>
                        <div>
                             <label htmlFor="gradeFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('filter_by_grade')}</label>
                             <select id="gradeFilter" value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSubject('all'); }} className="w-full mt-1 py-2 px-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 transition">
                                <option value="all">{t('all_grades')}</option>
                                {uniqueGrades.map(g => <option key={g} value={g}>{t('grade')} {g}</option>)}
                             </select>
                        </div>
                         <div>
                             <label htmlFor="subjectFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('filter_by_subject')}</label>
                             <select id="subjectFilter" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="w-full mt-1 py-2 px-3 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 transition">
                                <option value="all">{t('all_subjects')}</option>
                                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                         {hasFilters && (
                            <button onClick={() => {setSearchTerm(''); setFilterGrade('all'); setFilterSubject('all');}} className="flex items-center justify-center text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition">
                                <XCircleIcon className="w-4 h-4 ltr:mr-1 rtl:ml-1"/> {t('clear_filters')}
                            </button>
                         )}
                    </div>
                </div>
            )}


            {error && <p className="mb-4 text-red-500 text-center">{error}</p>}

            {hasBooks ? (
                hasResults ? (
                    <div className="space-y-8">
                        {groupedBooks.map(({ grade, subjects }) => (
                            <div key={grade}>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white pb-2 mb-4 border-b-2 border-sky-500">{t('grade')} {grade}</h3>
                                <div className="space-y-6">
                                    {Object.entries(subjects).sort(([a], [b]) => a.localeCompare(b)).map(([subject, bookItems]) =>(
                                        <div key={subject}>
                                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{subject}</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                {bookItems.map((book) => (
                                                    <div key={book.id} className="group relative bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 transition-all flex flex-col justify-between">
                                                        <a href={book.dataUrl} target="_blank" rel="noopener noreferrer" className="flex-grow flex flex-col items-center justify-center text-center">
                                                            {book.type.startsWith('image/') ? (
                                                                <img src={book.dataUrl} alt={book.name} className="h-24 w-auto object-contain mb-2 rounded" />
                                                            ) : (
                                                                <DocumentIcon className="h-24 w-24 text-gray-400 dark:text-gray-500 mb-2" />
                                                            )}
                                                            <h3 className="font-semibold text-sm text-gray-800 dark:text-white break-all">{book.name}</h3>
                                                        </a>
                                                        <button onClick={() => handleDeleteBook(book.id)} className="absolute top-2 ltr:right-2 rtl:left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition" aria-label={t('delete_book')}>
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                        <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('no_filtered_results_title')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('no_filtered_results_description')}</p>
                    </div>
                )
            ) : (
                 <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('no_books_title')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('no_books_description')}</p>
                </div>
            )}
            
            <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddBook} />
        </div>
    );
};

export default BooksTab;