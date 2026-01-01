import { useMemo } from 'react';

/**
 * Hook לולידציית פרמטרים
 * @param {Object} parameters - הפרמטרים הנוכחיים
 * @param {Array} parameterDefinitions - הגדרות הפרמטרים מה-ExperimentTemplate
 * @returns {Object} מצב הולידציה
 */
export function useParameterValidation(parameters, parameterDefinitions = []) {
    const validationState = useMemo(() => {
        if (!parameters || Object.keys(parameters).length === 0) {
            return {
                isValid: false,
                errors: {},
                hasErrors: true,
                errorCount: 1
            };
        }

        const errors = {};
        let errorCount = 0;

        // יצירת מפה של הגדרות פרמטרים לפי key
        const definitionsMap = {};
        (parameterDefinitions || []).forEach(def => {
            if (def.key) {
                definitionsMap[def.key] = def;
            }
        });

        // עובר על כל הפרמטרים ומוודא תקינותם
        Object.entries(parameters).forEach(([key, value]) => {
            const definition = definitionsMap[key];
            
            // אם אין הגדרה לפרמטר זה, זה כנראה פרמטר פנימי - דלג עליו
            if (!definition) {
                return;
            }

            // בדיקה רק לפרמטרים מספריים (float/int) שדורשים קלט חופשי מהמשתמש
            if (definition.type === 'float' || definition.type === 'int') {
                // בדיקת ערך ריק
                if (value === undefined || value === null || value === '') {
                    errors[key] = {
                        isValid: false,
                        error: 'שדה זה הוא חובה'
                    };
                    errorCount++;
                    return;
                }

                const numValue = parseFloat(value);
                
                // בדיקת מספר לא חוקי
                if (isNaN(numValue)) {
                    errors[key] = {
                        isValid: false,
                        error: 'יש להזין מספר חוקי'
                    };
                    errorCount++;
                    return;
                }

                // בדיקת טווח min
                if (definition.min !== undefined && numValue < definition.min) {
                    errors[key] = {
                        isValid: false,
                        error: `הערך חייב להיות לפחות ${definition.min}`
                    };
                    errorCount++;
                    return;
                }

                // בדיקת טווח max
                if (definition.max !== undefined && numValue > definition.max) {
                    errors[key] = {
                        isValid: false,
                        error: `הערך חייב להיות לכל היותר ${definition.max}`
                    };
                    errorCount++;
                    return;
                }
            }
            
            // פרמטרים מסוג select, bool, וכו' - אין צורך בולידציה מיוחדת
            // כל עוד יש להם ערך, הם תקינים
            errors[key] = {
                isValid: true,
                error: null
            };
        });

        const isValid = errorCount === 0;

        // console.log('useParameterValidation: Current state', {
        //     parametersCount: Object.keys(parameters).length,
        //     definitionsCount: parameterDefinitions.length,
        //     validationStateCount: errorCount,
        //     validationState: errors,
        //     allValid: isValid
        // });

        return {
            isValid,
            errors,
            hasErrors: errorCount > 0,
            errorCount
        };
    }, [parameters, parameterDefinitions]);

    return {
        validationState: validationState.errors,
        isAllValid: validationState.isValid,
        hasErrors: validationState.hasErrors,
        errorCount: validationState.errorCount
    };
}