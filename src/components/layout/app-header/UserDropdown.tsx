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
                <Button variant="ghost" size="sm" onClick={() => handleLanguageChange(oppositeLocale)}>
                    <Globe className="w-4 h-4" />
                    {t('common.oppositeLanguageShort')}
                </Button>
                <Button asChild size="sm">
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
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{user.full_name || user.email}</span>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={menuAlignStart} className="w-56">
                <DropdownMenuItem onClick={() => handleLanguageChange(oppositeLocale)} className="gap-2">
                    <Globe className="w-4 h-4" />
                    {t('common.switchToOppositeLanguage')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 gap-2">
                    <LogOut className="w-4 h-4" />
                    {t('common.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
