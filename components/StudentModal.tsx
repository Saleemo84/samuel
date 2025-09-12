import React, { useState, useContext } from 'react';
import { StudentContext } from '../contexts/StudentContext';
import { useTranslation } from '../hooks/useTranslation';
import { UserIcon, AcademicCapIcon, CalendarIcon } from './icons/Icons';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(6);
  const [grade, setGrade] = useState(1);
  const context = useContext(StudentContext);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && age > 0 && grade > 0) {
      context?.addStudent({ name, age, grade });
      setName('');
      setAge(6);
      setGrade(1);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">{t('addNewStudent')}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('studentName')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('age')}</label>
             <div className="relative">
               <span className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                min="6"
                max="18"
                className="w-full ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grade')}</label>
             <div className="relative">
              <span className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3">
                <AcademicCapIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="number"
                id="grade"
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value))}
                min="1"
                max="12"
                className="w-full ltr:pl-3 ltr:pr-10 rtl:pr-3 rtl:pl-10 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-gray-50 dark:bg-slate-700"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 rtl:space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
            >
              {t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;