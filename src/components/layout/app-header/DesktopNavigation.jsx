import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, BarChart3 } from 'lucide-react';
import ExperimentsDropdown from './ExperimentsDropdown';
import AdminDropdown from './AdminDropdown';
import UserDropdown from './UserDropdown';

export default function DesktopNavigation({ user, isRTL, experiments, location, handleLogout, handleLanguageChange }) {

    return (
        <nav className="flex items-center space-x-8 rtl:space-x-reverse">
            <Link
                to={createPageUrl("Dashboard")}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg font-medium transition-all duration-200 ${location.pathname === createPageUrl("Dashboard") ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <Home className="w-5 h-5" />
                <span>{isRTL ? "דף הבית" : "Home"}</span>
            </Link>

            <ExperimentsDropdown experiments={experiments} isRTL={isRTL} />

            <Link
                to={createPageUrl("Results")}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg font-medium transition-all duration-200 ${location.pathname === createPageUrl("Results") ? 'bg-green-100 text-green-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
                <BarChart3 className="w-5 h-5" />
                <span>{isRTL ? "ניתוח הניסויים שלי" : "My Experiment Analysis"}</span>
            </Link>

            <div className="flex-1"></div>

            <AdminDropdown user={user} location={location} isRTL={isRTL} />
            
            <UserDropdown 
                user={user} 
                isRTL={isRTL} 
                handleLogout={handleLogout} 
                handleLanguageChange={handleLanguageChange} 
            />
        </nav>
    );
}