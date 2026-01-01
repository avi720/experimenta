import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Settings, ChevronDown, Wrench } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function AdminDropdown({ user, location, isRTL }) {
    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 font-medium transition-all duration-200 ${(location.pathname.startsWith(createPageUrl("AdminExperiments"))) ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                    <Settings className="w-5 h-5" />
                    <span>{isRTL ? "ניהול" : "Admin"}</span>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl("AdminExperiments")} className="flex items-center w-full">
                        <Wrench className="ml-2 h-4 w-4" />
                        <span>{isRTL ? "ניהול ניסויים" : "Manage Experiments"}</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}