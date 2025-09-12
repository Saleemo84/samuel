import React, { useState, useMemo, FC } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface SceneModifications {
    sunWithGlasses?: boolean;
    cloudMissing?: boolean;
    doorColor?: string;
    appleMissing?: boolean;
    smoke?: boolean;
}

interface SceneProps {
    modifications?: SceneModifications;
    onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
    children?: React.ReactNode;
}

// A single, parameterizable component to draw both scenes
const Scene: FC<SceneProps> = ({ modifications = {}, onClick, children }) => (
    <svg viewBox="0 0 500 300" onClick={onClick} className={`w-full h-auto rounded-lg bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 ${onClick ? 'cursor-pointer' : ''}`} >
        {/* Sky */}
        <rect width="500" height="220" fill="#87CEEB" />
        {/* Ground */}
        <rect y="220" width="500" height="80" fill="#8FBC8F" />

        {/* Sun */}
        <g>
            <circle cx="70" cy="70" r="30" fill="#FFD700" />
            {modifications.sunWithGlasses && (
                <g>
                    <rect x="55" y="65" width="30" height="8" fill="black" rx="4" />
                    <line x1="70" y1="69" x2="80" y2="69" stroke="black" strokeWidth="2" />
                </g>
            )}
        </g>
        
        {/* Clouds */}
        {!modifications.cloudMissing && <path d="M 150 80 C 130 80, 130 60, 150 60 C 170 60, 170 80, 190 80 Z" fill="white" />}
        <path d="M 220 100 C 200 100, 200 80, 220 80 C 240 80, 240 100, 260 100 Z" fill="white" />
        <path d="M 300 70 C 280 70, 280 50, 300 50 C 320 50, 320 70, 340 70 Z" fill="white" />
        
        {/* House */}
        <g>
            <rect x="350" y="150" width="100" height="70" fill="#DEB887" stroke="#333" strokeWidth="1"/>
            <polygon points="340,150 460,150 400,110" fill="#A52A2A" stroke="#333" strokeWidth="1"/>
            <rect x="385" y="180" width="30" height="40" fill={modifications.doorColor || "#D9534F"} stroke="#333" strokeWidth="1"/>
        </g>
        
        {/* Chimney */}
        <g>
            <rect x="360" y="120" width="15" height="25" fill="#A0522D" />
            {modifications.smoke && <path d="M 365 118 Q 375 108 365 98 Q 355 88 365 78" stroke="#B0B0B0" strokeWidth="3" fill="none" />}
        </g>
        
        {/* Tree */}
        <g>
            <rect x="100" y="160" width="20" height="60" fill="#8B4513" />
            <circle cx="110" cy="140" r="40" fill="#228B22" />
            {/* Apples */}
            <circle cx="100" cy="130" r="5" fill="#D9534F" />
            <circle cx="125" cy="150" r="5" fill="#D9534F" />
            <circle cx="90" cy="150" r="5" fill="#D9534F" />
            {!modifications.appleMissing && <circle cx="120" cy="120" r="5" fill="#D9534F" />}
            <circle cx="130" cy="130" r="5" fill="#D9534F" />
        </g>
        
        {/* This allows us to render feedback circles/crosses on top */}
        {children}
    </svg>
);


interface Difference {
    id: number;
    x: number;
    y: number;
    r: number;
    found: boolean;
}

interface WrongClick {
    id: number;
    x: number;
    y: number;
}

const differencesData = [
    { id: 1, x: 70, y: 70, r: 15 },
    { id: 2, x: 165, y: 70, r: 35 },
    { id: 3, x: 400, y: 200, r: 25 },
    { id: 4, x: 120, y: 120, r: 10 },
    { id: 5, x: 368, y: 95, r: 25 },
];

const initialDifferencesState = () => differencesData.map(d => ({ ...d, found: false }));

const SpotTheDifference: React.FC = () => {
    const { t } = useTranslation();
    const [differences, setDifferences] = useState<Difference[]>(initialDifferencesState());
    const [wrongClicks, setWrongClicks] = useState<WrongClick[]>([]);

    const totalDifferences = differencesData.length;
    const foundCount = useMemo(() => differences.filter(d => d.found).length, [differences]);
    const isGameOver = useMemo(() => foundCount === totalDifferences, [foundCount, totalDifferences]);
    
    const modsForModifiedScene: SceneModifications = {
        sunWithGlasses: true,
        cloudMissing: true,
        doorColor: '#5BC0DE',
        appleMissing: true,
        smoke: true,
    };

    const handleResetGame = () => {
        setDifferences(initialDifferencesState());
        setWrongClicks([]);
    };

    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (isGameOver) return;

        const svg = event.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const cursorPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        const { x, y } = cursorPoint;

        let foundADifference = false;
        
        for (const diff of differences) {
            if (diff.found) continue;
            
            const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
            if (distance < diff.r) {
                setDifferences(prev => prev.map(d => d.id === diff.id ? { ...d, found: true } : d));
                foundADifference = true;
                break;
            }
        }
        
        if (!foundADifference) {
            const newClick = { x, y, id: Date.now() };
            setWrongClicks(prev => [...prev, newClick]);
            setTimeout(() => {
                setWrongClicks(prev => prev.filter(c => c.id !== newClick.id));
            }, 500);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('spot_the_difference_title')}</h3>
                <p className="text-gray-600 dark:text-gray-300">{t('spot_the_difference_description')}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                <Scene />
                <div className="relative">
                     <Scene modifications={modsForModifiedScene} onClick={handleClick}>
                        {differences.filter(d => d.found).map(d => (
                            <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill="none" stroke="rgba(74, 222, 128, 0.7)" strokeWidth="4" />
                        ))}
                        {wrongClicks.map(c => (
                            <g key={c.id} transform={`translate(${c.x}, ${c.y})`} className="opacity-70">
                               <line x1="-10" y1="-10" x2="10" y2="10" stroke="red" strokeWidth="3" strokeLinecap="round" />
                               <line x1="-10" y1="10" x2="10" y2="-10" stroke="red" strokeWidth="3" strokeLinecap="round" />
                            </g>
                        ))}
                     </Scene>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                <div className="text-lg font-bold">
                    {t('differences_found')}: <span className="text-sky-600 dark:text-sky-400">{foundCount} / {totalDifferences}</span>
                </div>
                {isGameOver && (
                    <div className="text-center">
                        <h4 className="text-xl font-bold text-green-600 dark:text-green-400">{t('congratulations')}</h4>
                        <p className="text-sm">{t('all_differences_found')}</p>
                    </div>
                )}
                <button 
                    onClick={handleResetGame}
                    className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition"
                >
                    {t('play_again')}
                </button>
            </div>

        </div>
    );
};

export default SpotTheDifference;
