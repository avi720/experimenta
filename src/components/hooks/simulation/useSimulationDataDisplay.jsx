import { useMemo } from 'react';

/**
 * Hook לחישוב נתוני התצוגה על בסיס הזמן הנוכחי
 */
export function useSimulationDataDisplay(currentData, playbackTime, getDataPointAtTime) {
    // אם יש currentData (סימולציה רצה כרגע), השתמש בו
    // אחרת, אם יש playbackTime (scrubbing), חפש את הנתון המתאים
    const displayedDataPoint = useMemo(() => {
        if (currentData) {
            return currentData;
        }
        
        if (playbackTime !== undefined && getDataPointAtTime) {
            return getDataPointAtTime(playbackTime);
        }
        
        return null;
    }, [currentData, playbackTime, getDataPointAtTime]);

    return {
        displayedDataPoint
    };
}