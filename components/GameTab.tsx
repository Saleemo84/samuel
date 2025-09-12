import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import SpotTheDifference from './games/SpotTheDifference';
import { PuzzlePieceIcon } from './icons/Icons';

const GameTab: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <PuzzlePieceIcon className="w-6 h-6 ltr:mr-2 rtl:ml-2 text-sky-500" /> 
                    {t('games_title')}
                </h2>
                
                <div className="mt-6">
                    <SpotTheDifference />
                </div>
            </div>
        </div>
    );
};

export default GameTab;
