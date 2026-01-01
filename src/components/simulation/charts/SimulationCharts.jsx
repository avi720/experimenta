import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

export default function SimulationCharts({ 
    simulationData, 
    experiment, 
    isRTL,
    isOpen = false,
    onToggle
}) {
    const [height, setHeight] = useState(300);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);
    
    const hasData = simulationData && simulationData.length > 0;
    const outputs = experiment?.outputs || [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        dragStartHeight.current = height;
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const deltaY = dragStartY.current - e.clientY;
            const newHeight = Math.max(150, Math.min(600, dragStartHeight.current + deltaY));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, height]);

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                <button
                    onClick={onToggle}
                    className="px-6 py-3 bg-slate-600/40 hover:bg-slate-600/50 backdrop-blur-sm text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                    <div className="text-sm font-semibold">
                        {isRTL ? "גרפים חיים" : "Live Charts"}
                    </div>
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ y: height }}
            animate={{ y: 0 }}
            exit={{ y: height }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-2xl z-40"
            style={{ height: `${height}px` }}
        >
            {/* Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`h-6 bg-slate-100 border-b border-slate-200 flex items-center justify-center cursor-ns-resize hover:bg-slate-200 transition-colors relative ${
                    isDragging ? 'bg-slate-200' : ''
                }`}
            >
                <GripHorizontal className="w-5 h-5 text-slate-400" />
                
                {/* כפתורים בצד שמאל */}
                <div className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 transform -translate-y-1/2 flex items-center gap-1`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-slate-200"
                        title={isRTL ? "פתח בחלון צף" : "Open in floating window"}
                    >
                        <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-6 w-6 hover:bg-slate-200"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto" style={{ height: `calc(${height}px - 24px)` }}>
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <p className="text-slate-500 text-sm font-medium">
                            {isRTL 
                                ? "הרץ את הסימולציה כדי לראות גרפים" 
                                : "Run the simulation to see charts"
                            }
                        </p>
                        <p className="text-slate-400 text-xs mt-2">
                            {isRTL 
                                ? "לחץ על כפתור ההפעלה בקונסולה" 
                                : "Click the play button in the console"
                            }
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                            data={simulationData}
                            key={simulationData.length}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="time" 
                                label={{ 
                                    value: isRTL ? 'זמן (s)' : 'Time (s)', 
                                    position: 'insideBottom', 
                                    offset: -5 
                                }}
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                                domain={['dataMin', 'dataMax']}
                            />
                            <YAxis 
                                label={{ 
                                    value: isRTL ? 'ערכים' : 'Values', 
                                    angle: -90, 
                                    position: 'insideLeft' 
                                }}
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'white', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend 
                                wrapperStyle={{ fontSize: '12px' }}
                            />
                            {outputs.map((output, index) => {
                                const hasOutputData = simulationData.some(d => d[output] !== undefined);
                                if (!hasOutputData) return null;

                                return (
                                    <Line 
                                        key={output}
                                        type="monotone" 
                                        dataKey={output} 
                                        name={output}
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
}