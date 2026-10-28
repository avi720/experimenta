import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/i18n';
import ExperimentsDropdown from './ExperimentsDropdown';
import AdminDropdown from './AdminDropdown';
import UserDropdown from './UserDropdown';
import { headerItemClass } from './headerItemClass';
import type { AppHeaderProps } from '@/types/layout';

export default function DesktopNavigation({ user, isRTL, experiments, location, handleLogout, handleLanguageChange }: AppHeaderProps) {
    const { t } = useTranslation(isRTL);

    return (
        <nav aria-label={t('header.mainNavigation')} className="hidden md:flex flex-1 items-center gap-1 ms-8">
            <ExperimentsDropdown experiments={experiments} isRTL={isRTL} />

            <Link
                to={createPageUrl("Results")}
                className={headerItemClass(location.pathname === createPageUrl("Results"))}
            >
                {t('common.myExperimentAnalysis')}
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
