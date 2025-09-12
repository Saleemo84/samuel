import React, { useContext } from 'react';
import { StudentContext } from '../contexts/StudentContext';
import { useTranslation } from '../hooks/useTranslation';
import { UserPlusIcon } from './icons/Icons';

const NoStudentSelected: React.FC = () => {
    const context = useContext(StudentContext);
    const { t } = useTranslation();

    return (
        <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-lg shadow-lg">
            <UserPlusIcon className="mx-auto h-16 w-16 text-sky-400" />
            <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">{t('no_student_selected_title')}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('no_student_selected_description')}
            </p>
            <div className="mt-6">
                <button
                    type="button"
                    onClick={() => context?.openStudentModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                    <UserPlusIcon className="ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 h-5 w-5" />
                    {t('addNewStudent')}
                </button>
            </div>
        </div>
    );
};

export default NoStudentSelected;