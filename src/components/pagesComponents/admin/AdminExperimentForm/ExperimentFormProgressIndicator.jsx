import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const tabs = [
  { value: 'general', label: 'כללי' },
  { value: 'content', label: 'תוכן' },
  { value: 'parameters', label: 'פרמטרים' },
  { value: 'presets', label: 'תבניות' },
  { value: 'advanced', label: 'מתקדם' }
];

export default function ExperimentFormProgressIndicator({ currentTab }) {
  const currentIndex = tabs.findIndex(tab => tab.value === currentTab);

  return (
    <div className="flex items-center justify-between max-w-3xl mx-auto">
      {tabs.map((tab, index) => (
        <React.Fragment key={tab.value}>
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
              ${index <= currentIndex 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white border-slate-300 text-slate-400'
              }
            `}>
              {index < currentIndex ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <span className={`
              text-xs mt-2 font-medium
              ${index <= currentIndex ? 'text-blue-600' : 'text-slate-400'}
            `}>
              {tab.label}
            </span>
          </div>
          
          {index < tabs.length - 1 && (
            <div className={`
              flex-1 h-0.5 mx-2 transition-all
              ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-200'}
            `} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}