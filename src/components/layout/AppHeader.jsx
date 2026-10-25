import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Beaker, Menu, X, Home, BarChart3, Wrench, Globe, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import DesktopNavigation from './app-header/DesktopNavigation';
import ExperimentsDropdown from './app-header/ExperimentsDropdown';

export default function AppHeader({ isRTL, user, settings, experiments, location, handleLogout, handleLanguageChange }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location?.pathname, location?.search]);

    return (
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3 sm:py-4 gap-2">
                    <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <Beaker className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                            Experimenta
                        </span>
                    </Link>

                    <DesktopNavigation
                        user={user}
                        isRTL={isRTL}
                        settings={settings}
                        experiments={experiments}
                        location={location}
                        handleLogout={handleLogout}
                        handleLanguageChange={handleLanguageChange}
                    />

                    {/* Mobile controls (< md) */}
                    <div className="flex md:hidden items-center gap-1">
                        <ExperimentsDropdown experiments={experiments} isRTL={isRTL} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={
                                mobileMenuOpen
                                    ? isRTL ? "סגור תפריט" : "Close menu"
                                    : isRTL ? "פתח תפריט" : "Open menu"
                            }
                            aria-expanded={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile navigation drawer (< md) */}
                {mobileMenuOpen && (
                    <nav
                        aria-label={isRTL ? "ניווט ראשי" : "Main navigation"}
                        className="md:hidden border-t border-slate-200 py-3 space-y-1"
                    >
                        <Link
                            to={createPageUrl("Dashboard")}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium ${
                                location.pathname === createPageUrl("Dashboard")
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Home className="w-4 h-4" />
                            <span>{isRTL ? "דף הבית" : "Home"}</span>
                        </Link>

                        <Link
                            to={createPageUrl("Lab")}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium ${
                                location.pathname === createPageUrl("Lab")
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <Beaker className="w-4 h-4" />
                            <span>{isRTL ? "כל הניסויים" : "All Experiments"}</span>
                        </Link>

                        <Link
                            to={createPageUrl("Results")}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium ${
                                location.pathname === createPageUrl("Results")
                                    ? 'bg-green-100 text-green-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>{isRTL ? "ניתוח הניסויים שלי" : "My Experiment Analysis"}</span>
                        </Link>

                        {user?.role === 'admin' && (
                            <Link
                                to={createPageUrl("AdminExperiments")}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium ${
                                    location.pathname.startsWith(createPageUrl("AdminExperiments"))
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Wrench className="w-4 h-4" />
                                <span>{isRTL ? "ניהול ניסויים" : "Manage Experiments"}</span>
                            </Link>
                        )}

                        <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between gap-2 px-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLanguageChange(isRTL ? 'en' : 'he')}
                                className="gap-1.5"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{isRTL ? "English" : "עברית"}</span>
                            </Button>

                            {user ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="text-red-600 gap-1.5"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{isRTL ? "התנתק" : "Logout"}</span>
                                </Button>
                            ) : (
                                <Button asChild size="sm" className="gap-1.5">
                                    <Link to="/Login">
                                        <LogIn className="w-4 h-4" />
                                        <span>{isRTL ? "התחברות" : "Sign in"}</span>
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
