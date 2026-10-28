import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, Wrench } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { headerItemClass } from './headerItemClass';
import type { IsRTLProps } from '@/types/props';
import type { HeaderLocationProps, HeaderUserProps } from '@/types/layout';

export default function AdminDropdown({ user, location, isRTL }: HeaderUserProps & HeaderLocationProps & IsRTLProps) {
    const { t } = useTranslation(isRTL);

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={headerItemClass(location.pathname.startsWith(createPageUrl("AdminExperiments")))}>
                    <span>{t('common.admin')}</span>
                    <ChevronDown className="w-4 h-4 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-line">
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl("AdminExperiments")} className="flex items-center gap-2 w-full">
                        <Wrench className="h-4 w-4" />
                        <span>{t('common.manageExperiments')}</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
