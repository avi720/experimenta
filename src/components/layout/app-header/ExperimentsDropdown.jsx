import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Beaker, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Helper function to get the correct page URL for an experiment
const getExperimentPageUrl = (slug) => {
    const slugToPageMap = {
        'free-fall': 'FreeFallExperiment',
        'sho': 'ShoExperiment',
        'quantum-tunneling': 'QuantumTunnelingExperiment',
        'double-slit': 'DoubleSlitExperiment',
    };
    const pageName = slugToPageMap[slug];
    return pageName ? createPageUrl(pageName) : createPageUrl('Lab');
};

const categoryNames = {
    "Classical": { he: "מכניקה קלאסית", en: "Classical Mechanics" },
    "Waves": { he: "גלים ואופטיקה", en: "Waves & Optics" },
    "Quantum": { he: "פיזיקה קוונטית", en: "Quantum Physics" },
    "EM": { he: "אלקטרומגנטיות", en: "Electromagnetism" },
    "Circuits": { he: "מעגלים חשמליים", en: "Electrical Circuits" }
};

export default function ExperimentsDropdown({ experiments, isRTL }) {
    const experimentsByCategory = experiments.reduce((acc, exp) => {
        if (!acc[exp.category]) {
            acc[exp.category] = [];
        }
        acc[exp.category].push(exp);
        return acc;
    }, {});

    if (experiments.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 font-medium">
                    <Beaker className="w-5 h-5" />
                    <span>{isRTL ? "ניסויים" : "Experiments"}</span>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "end" : "start"} className="w-72">
              <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Lab")}>
                      {isRTL ? "כל הניסויים" : "All Experiments"}
                  </Link>
              </DropdownMenuItem>
                {Object.keys(experimentsByCategory).length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">{isRTL ? "קטגוריות" : "Categories"}</DropdownMenuLabel>
                        {Object.entries(experimentsByCategory).map(([category, categoryExperiments]) => (
                            <div key={category} className="relative group">
                                <DropdownMenuItem asChild>
                                    <Link to={createPageUrl(`Lab?category=${category}`)} className="flex items-center justify-between w-full">
                                        <span>{isRTL ? categoryNames[category]?.he : categoryNames[category]?.en}</span>
                                        <span className="text-xs text-slate-400">({categoryExperiments.length})</span>
                                    </Link>
                                </DropdownMenuItem>
                                <div className={`absolute ${isRTL ? 'right-full mr-2' : 'left-full ml-2'} top-0 w-64 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                                    <div className="p-2">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">{isRTL ? categoryNames[category]?.he : categoryNames[category]?.en}</div>
                                        {categoryExperiments.map((experiment) => (
                                            <Link key={experiment.id} to={`${getExperimentPageUrl(experiment.slug)}?id=${encodeURIComponent(experiment.slug)}`} state={{ experiment }} className="flex items-center px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors">
                                                <Beaker className="w-3 h-3 mr-2 text-blue-500" />
                                                <span className="flex-1">{isRTL ? experiment.i18n_texts?.he?.title || experiment.slug : experiment.i18n_texts?.en?.title || experiment.slug}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}