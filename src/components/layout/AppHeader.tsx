import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BlackHoleMark from '@/components/brand/BlackHoleMark';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/i18n';
import DesktopNavigation from './app-header/DesktopNavigation';
import ExperimentsDropdown from './app-header/ExperimentsDropdown';
import type { AppHeaderProps } from '@/types/layout';

export default function AppHeader({ isRTL, user, settings, experiments, location, handleLogout, handleLanguageChange }: AppHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t, oppositeLocale } = useTranslation(isRTL);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location?.pathname, location?.search]);

    const mobileLinkClass = (isActive: boolean) =>
        `focus-ring flex items-center px-3 py-3 rounded-md text-[17px] border-s-2 ${
            isActive ? 'border-plasma text-star bg-space-raised' : 'border-transparent text-dust hover:text-star hover:bg-space-raised'
        }`;

    return (
        <header className="sticky top-0 z-50 bg-space/[0.85] backdrop-blur-md border-b border-line/70 text-star">
            {/* Full width: the brand and tabs hug the reading-start edge, the controls the other. */}
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2">
                    <Link
                        to={createPageUrl("Dashboard")}
                        className="focus-ring flex items-center gap-2.5 min-w-0 rounded-md"
                        aria-label="Experimenta"
                    >
                        <BlackHoleMark className="h-8 w-8 flex-shrink-0" />
                        <span className="text-[19px] font-medium tracking-tight text-star" lang="en" dir="ltr">
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
                            className="focus-ring text-star"
                            aria-label={mobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
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
                        aria-label={t('header.mainNavigation')}
                        className="md:hidden border-t border-line py-3 space-y-1"
                    >
                        <Link
                            to={createPageUrl("Dashboard")}
                            className={mobileLinkClass(location.pathname === createPageUrl("Dashboard"))}
                        >
                            {t('common.home')}
                        </Link>

                        <Link
                            to={createPageUrl("Lab")}
                            className={mobileLinkClass(location.pathname === createPageUrl("Lab"))}
                        >
                            {t('common.allExperiments')}
                        </Link>

                        <Link
                            to={createPageUrl("Results")}
                            className={mobileLinkClass(location.pathname === createPageUrl("Results"))}
                        >
                            {t('common.myExperimentAnalysis')}
                        </Link>

                        {user?.role === 'admin' && (
                            <Link
                                to={createPageUrl("AdminExperiments")}
                                className={mobileLinkClass(location.pathname.startsWith(createPageUrl("AdminExperiments")))}
                            >
                                {t('common.manageExperiments')}
                            </Link>
                        )}

                        <div className="border-t border-line pt-3 mt-2 flex items-center justify-between gap-2 px-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLanguageChange(oppositeLocale)}
                                className="focus-ring gap-1.5 text-dust hover:text-star"
                            >
                                <Globe className="w-4 h-4" />
                                <span>{t('common.oppositeLanguageName')}</span>
                            </Button>

                            {user ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="focus-ring gap-1.5 text-dust hover:text-star"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{t('common.logout')}</span>
                                </Button>
                            ) : (
                                <Button asChild size="sm" className="focus-ring gap-1.5 shadow-none">
                                    <Link to="/Login">
                                        <LogIn className="w-4 h-4" />
                                        <span>{t('common.signIn')}</span>
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
