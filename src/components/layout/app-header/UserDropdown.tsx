import { Link } from 'react-router-dom';
import { User, LogOut, Globe, ChevronDown, LogIn } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import type { IsRTLProps } from '@/types/props';
import type { HeaderActionsProps, HeaderUserProps } from '@/types/layout';

export default function UserDropdown({ user, isRTL, handleLogout, handleLanguageChange }: HeaderUserProps & IsRTLProps & HeaderActionsProps) {
    const { t, oppositeLocale, menuAlignStart } = useTranslation(isRTL);

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="focus-ring text-dust hover:text-star hover:bg-transparent" onClick={() => handleLanguageChange(oppositeLocale)}>
                    <Globe className="w-4 h-4" />
                    {t('common.oppositeLanguageShort')}
                </Button>
                <Button asChild size="sm" className="focus-ring shadow-none text-[14px] h-9 px-4">
                    <Link to="/Login">
                        <LogIn className="w-4 h-4" />
                        {t('common.signIn')}
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="focus-ring flex items-center gap-2 px-2 text-dust hover:text-star hover:bg-transparent font-normal">
                    <span className="w-8 h-8 border border-line rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-plasma" />
                    </span>
                    <span className="max-w-[12rem] truncate">{user.full_name || user.email}</span>
                    <ChevronDown className="w-4 h-4 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={menuAlignStart} className="theme-space w-56 border-line">
                <DropdownMenuItem onClick={() => handleLanguageChange(oppositeLocale)} className="gap-2">
                    <Globe className="w-4 h-4" />
                    {t('common.switchToOppositeLanguage')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    {t('common.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
