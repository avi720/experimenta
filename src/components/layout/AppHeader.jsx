import React from 'react';
import { Beaker } from 'lucide-react';
import DesktopNavigation from './app-header/DesktopNavigation';

export default function AppHeader({ isRTL, user, settings, experiments, location, handleLogout, handleLanguageChange }) {

    return (
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Beaker className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {isRTL ? "Experimenta" : "Experimenta"}
                            </h1>
                        </div>
                    </div>

                    <DesktopNavigation 
                        user={user}
                        isRTL={isRTL}
                        settings={settings}
                        experiments={experiments}
                        location={location}
                        handleLogout={handleLogout}
                        handleLanguageChange={handleLanguageChange}
                    />
                </div>
            </div>
        </header>
    );
}