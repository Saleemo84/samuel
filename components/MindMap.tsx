import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { MindMapNode } from '../types';
import { PlusIcon, MinusIcon, ArrowPathIcon } from './icons/Icons';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 30;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

interface ProcessedNode extends MindMapNode {
    id: string;
    x: number;
    y: number;
    isRoot?: boolean;
    children: ProcessedNode[];
    width: number; // width of the entire subtree
}

interface Path {
    id: string;
    d: string;
}

// Custom hook to process the mind map layout
const useMindMapLayout = (rootNode: MindMapNode) => {
    return useMemo(() => {
        const processedNodes: Omit<ProcessedNode, 'children' | 'width'>[] = [];
        const paths: Path[] = [];
        let nodeId = 0;

        function layout(node: MindMapNode, depth: number, yOffset: number): ProcessedNode {
            const currentId = `node-${nodeId++}`;
            const isRoot = depth === 0;
            
            let childrenHeight = 0;
            const processedChildren: ProcessedNode[] = (node.children || []).map(child => {
                const childNode = layout(child, depth + 1, yOffset + childrenHeight);
                childrenHeight += childNode.width + VERTICAL_SPACING;
                return childNode;
            });
            
            if (childrenHeight > 0) {
              childrenHeight -= VERTICAL_SPACING;
            }

            const x = depth * (NODE_WIDTH + HORIZONTAL_SPACING);
            const y = childrenHeight > 0 
                ? yOffset + (childrenHeight / 2) - (NODE_HEIGHT / 2)
                : yOffset;
            
            const pNode = {
                ...node,
                id: currentId,
                x,
                y,
                isRoot,
                children: processedChildren,
                width: Math.max(NODE_HEIGHT, childrenHeight),
            };

            processedNodes.push({ id: pNode.id, x: pNode.x, y: pNode.y, title: pNode.title, isRoot: pNode.isRoot });

            processedChildren.forEach(child => {
                paths.push({
                    id: `path-${pNode.id}-${child.id}`,
                    d: `M ${pNode.x + NODE_WIDTH} ${pNode.y + NODE_HEIGHT / 2} C ${pNode.x + NODE_WIDTH + HORIZONTAL_SPACING / 2} ${pNode.y + NODE_HEIGHT / 2}, ${child.x - HORIZONTAL_SPACING / 2} ${child.y + NODE_HEIGHT / 2}, ${child.x} ${child.y + NODE_HEIGHT / 2}`
                });
            });

            return pNode;
        }

        const tree = layout(rootNode, 0, 0);
        const totalWidth = tree.x + NODE_WIDTH;
        const totalHeight = tree.width;

        return { nodes: processedNodes, paths, totalWidth, totalHeight };
    }, [rootNode]);
};

const MindMap: React.FC<{ node: MindMapNode }> = ({ node }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { nodes, paths, totalWidth, totalHeight } = useMindMapLayout(node);

    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const resetView = useCallback(() => {
        if (!svgRef.current || totalWidth === 0 || totalHeight === 0) return;
        const svg = svgRef.current;
        const { width, height } = svg.getBoundingClientRect();
        
        const scaleX = width / (totalWidth + HORIZONTAL_SPACING);
        const scaleY = height / (totalHeight + VERTICAL_SPACING);
        const initialScale = Math.min(scaleX, scaleY) * 0.9;
        
        const initialX = (width - totalWidth * initialScale) / 2;
        const initialY = (height - totalHeight * initialScale) / 2;

        setTransform({ x: initialX, y: initialY, k: initialScale });
    }, [totalWidth, totalHeight]);

    useEffect(() => {
      resetView();
    }, [resetView]);
    
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        
        const observer = new ResizeObserver(resetView);
        observer.observe(svg);
        
        return () => observer.unobserve(svg);
    }, [resetView]);

    const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (!svgRef.current) return;

        const svg = svgRef.current;
        const { left, top } = svg.getBoundingClientRect();
        
        const pointerX = e.clientX - left;
        const pointerY = e.clientY - top;

        const scaleFactor = 1.1;
        const newScale = e.deltaY < 0 ? transform.k * scaleFactor : transform.k / scaleFactor;
        const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

        const dx = (pointerX - transform.x) * (clampedScale / transform.k - 1);
        const dy = (pointerY - transform.y) * (clampedScale / transform.k - 1);

        setTransform({
            x: transform.x - dx,
            y: transform.y - dy,
            k: clampedScale
        });
    }, [transform]);

    const startPanInteraction = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
    }, []);

    const handlePanInteraction = useCallback((e: MouseEvent) => {
        if (!isPanning) return;
        e.preventDefault();
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
    }, [isPanning, panStart]);

    const endPanInteraction = useCallback(() => {
        setIsPanning(false);
    }, []);

    useEffect(() => {
        if (isPanning) {
            window.addEventListener('mousemove', handlePanInteraction);
            window.addEventListener('mouseup', endPanInteraction);
        }
        return () => {
            window.removeEventListener('mousemove', handlePanInteraction);
            window.removeEventListener('mouseup', endPanInteraction);
        };
    }, [isPanning, handlePanInteraction, endPanInteraction]);

    const zoom = (factor: number) => {
        if (!svgRef.current) return;
        const svg = svgRef.current;
        const { width, height } = svg.getBoundingClientRect();
        const centerX = width / 2;
        const centerY = height / 2;

        const newScale = transform.k * factor;
        const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

        const dx = (centerX - transform.x) * (clampedScale / transform.k - 1);
        const dy = (centerY - transform.y) * (clampedScale / transform.k - 1);

        setTransform({
            x: transform.x - dx,
            y: transform.y - dy,
            k: clampedScale
        });
    };

    return (
        <div className="relative w-full h-96 min-h-[300px] border dark:border-slate-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-900/50">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                onWheel={handleWheel}
                onMouseDown={startPanInteraction}
                className={isPanning ? 'cursor-grabbing' : 'cursor-grab'}
            >
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                    {paths.map(path => (
                        <path
                            key={path.id}
                            d={path.d}
                            stroke="#94a3b8"
                            strokeWidth="2"
                            fill="none"
                        />
                    ))}
                    {nodes.map(n => (
                         <foreignObject 
                            key={n.id} 
                            x={n.x} 
                            y={n.y} 
                            width={NODE_WIDTH} 
                            height={NODE_HEIGHT}
                            className="overflow-visible"
                         >
                            <div 
                                className={`w-full h-full flex items-center justify-center p-2 rounded-lg shadow-md text-center text-sm font-medium transition-transform transform hover:scale-105
                                ${n.isRoot ? 'bg-sky-500 text-white' : 'bg-sky-100 dark:bg-slate-700 text-sky-800 dark:text-sky-200'}
                                `}
                                style={{
                                    border: '1px solid',
                                    borderColor: n.isRoot ? 'transparent' : 'rgba(14, 165, 233, 0.3)',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {n.title}
                            </div>
                        </foreignObject>
                    ))}
                </g>
            </svg>
            <div className="absolute bottom-3 ltr:right-3 rtl:left-3 flex flex-col space-y-2 z-10">
                <button onClick={() => zoom(1.2)} aria-label="Zoom in" className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition border dark:border-slate-600">
                    <PlusIcon className="w-5 h-5 text-gray-700 dark:text-gray-200"/>
                </button>
                <button onClick={() => zoom(0.8)} aria-label="Zoom out" className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition border dark:border-slate-600">
                    <MinusIcon className="w-5 h-5 text-gray-700 dark:text-gray-200"/>
                </button>
                <button onClick={resetView} aria-label="Reset view" className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition border dark:border-slate-600">
                    <ArrowPathIcon className="w-5 h-5 text-gray-700 dark:text-gray-200"/>
                </button>
            </div>
        </div>
    );
};

export default MindMap;
