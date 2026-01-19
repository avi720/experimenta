// קובץ שאחראי על הלוגיקה של מנוע הסימולציה. כלומר, חישוב הנתונים בסימולציה בצעדים קבועים.
import { useState, useCallback, useRef } from 'react';

// קבוע: צעד זמן קבוע עבור מנוע הסימולציה (בשניות)
const FIXED_DT_ENGINE = 0.001;

export function useSimulationEngineLogic({ calculateStepFn, onSimulationComplete}) {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationData, setSimulationData] = useState([]);
    const shouldStopRef = useRef(false);

    /**
     * מנהל את ריצת מנוע הסימולציה
     * מחשב נתונים בצעדים קבועים (FIXED_DT_ENGINE) עד למקסימום הזמן
     */
    const runEngine = useCallback(async (parameters, maxSimulationTime) => {
        console.log('[useSimulationEngineLogic] runEngine started', { parameters, maxSimulationTime });
        shouldStopRef.current = false;
        const tempSimulationData = [];
        
        let currentStep = 0;
        let currentTime = 0.0;
        let yieldCounter = 0;
        const YIELD_EVERY_N_STEPS = 1000;

        try {
            while (currentTime <= maxSimulationTime && !shouldStopRef.current) {
                currentTime = currentStep * FIXED_DT_ENGINE;
                
                const dataPoint = calculateStepFn(currentTime, parameters);
                tempSimulationData.push(dataPoint);
                console.log("tempData: ", tempSimulationData.length," maxSimulationTime: ", maxSimulationTime);
                
                if (dataPoint.shouldStop) {
                    console.log('[useSimulationEngineLogic] shouldStop triggered at', currentTime);
                    break;
                }
                
                currentStep++;
                
                if (yieldCounter >= YIELD_EVERY_N_STEPS) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                    yieldCounter = 0;
                }
                yieldCounter++;
            }
            
            console.log('[useSimulationEngineLogic] runEngine completed', { 
                dataPointsCalculated: tempSimulationData.length,
                finalTime: tempSimulationData.length > 0 ? tempSimulationData[tempSimulationData.length - 1].time : 0
            });
            
            setSimulationData(tempSimulationData); // <--- הנתונים נשמרים כאן
            setIsSimulating(false); // <--- הסימולציה סיימה לחשב
            if (onSimulationComplete) {
                onSimulationComplete(tempSimulationData);
            }

        } catch (error) {
            console.error('[useSimulationEngineLogic] Simulation engine error:', error);
            setSimulationData(tempSimulationData); // גם בשגיאה נשמור את מה שהצלחנו לחשב
            setIsSimulating(false);
            if (onSimulationComplete) {
                onSimulationComplete(tempSimulationData);
            }
        }
    }, [calculateStepFn, onSimulationComplete]);

    const startSimulation = useCallback((parameters, maxSimulationTime) => {
        console.log('[useSimulationEngineLogic] startSimulation called', { 
            parameters, 
            maxSimulationTime, 
            isSimulating 
        });
        
        if (isSimulating) {
            console.log('[useSimulationEngineLogic] startSimulation blocked - already simulating');
            return;
        }
        
        setIsSimulating(true);
        setSimulationData([]);
        
        runEngine(parameters, maxSimulationTime); // הסרנו את ה-onComplete מכאן
    }, [isSimulating, runEngine]);


    const continueSimulation = useCallback((parameters, toTime) => {
        if (isSimulating) return;
        
        setIsSimulating(true);
        
        runEngine(parameters, toTime); // הסרנו את ה-onComplete מכאן
    }, [isSimulating, runEngine]);

    const stopSimulation = () => {
        shouldStopRef.current = true;
        setIsSimulating(false);
    };

    const resetSimulation = () => {
        stopSimulation();
        setSimulationData([]);
    };

    const getMaxAvailableTime = () => {
        if (simulationData.length === 0) return 0;
        return simulationData[simulationData.length - 1].time;
    };

    const getDataPointAtTime = useCallback((requestedTime) => {
        if (simulationData.length === 0) {
            return null;
        }

        const clampedTime = Math.max(0, Math.min(requestedTime, getMaxAvailableTime()));

        let closestIndex = 0;
        let minDiff = Math.abs(simulationData[0].time - clampedTime);

        for (let i = 1; i < simulationData.length; i++) {
            const diff = Math.abs(simulationData[i].time - clampedTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
            if (diff > minDiff) {
                break;
            }
        }

        return simulationData[closestIndex];
    }, [simulationData, getMaxAvailableTime]);

    return {
        isSimulating,
        simulationData,
        startSimulation,
        continueSimulation,
        stopSimulation,
        resetSimulation,
        getMaxAvailableTime,
        getDataPointAtTime,
        FIXED_DT_ENGINE
    };
}