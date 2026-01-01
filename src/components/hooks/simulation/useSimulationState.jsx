import { useState } from 'react';
import { useParameterValidation } from './parameters/useParameterValidation';

/**
 * Hook לניהול מצב הסימולציה
 */
export function useSimulationState(parameters) {
    // מצב הסימולציה: 'idle', 'initializing', 'running', 'paused', 'completed'
    const [simulationStatus, setSimulationStatus] = useState('idle');
    
    // כל הנתונים שהתקבלו (מחושבים בזמן אמת)
    const [fullSimulationData, setFullSimulationData] = useState([]);
    
    // הזמן המקסימלי של הסימולציה (נקבע מהפרמטרים)
    const [maxSimulationTime, setMaxSimulationTime] = useState(0);
    
    // הזמן המקסימלי שהסימולציה "הגיעה אליו" בזמן ריצה
    const [currentSimulationTime, setCurrentSimulationTime] = useState(0);
    
    // הזמן הנוכחי לתצוגה (playback)
    const [playbackTime, setPlaybackTime] = useState(0);

    // ולידציה של פרמטרים
    const { validationState, isAllValid } = useParameterValidation(parameters);

    return {
        simulationStatus,
        setSimulationStatus,
        fullSimulationData,
        setFullSimulationData,
        maxSimulationTime,
        setMaxSimulationTime,
        currentTime: currentSimulationTime,
        setCurrentTime: setCurrentSimulationTime,
        playbackTime,
        setPlaybackTime,
        validationState,
        isAllValid
    };
}