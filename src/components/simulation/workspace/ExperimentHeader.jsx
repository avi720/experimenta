import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Settings, Save, Download, User, LogOut, Home, ChevronDown, Beaker
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { createPageUrl } from "@/utils";

const categoryNames = {
    "Classical": { he: "מכניקה קלאסית", en: "Classical Mechanics" },
    "Waves": { he: "גלים ואופטיקה", en: "Waves & Optics" },
    "Quantum": { he: "פיזיקה קוונטית", en: "Quantum Physics" },
    "EM": { he: "אלקטרומגנטיות", en: "Electromagnetism" },
    "Circuits": { he: "מעגלים חשמליים", en: "Electrical Circuits" }
};

export default function ExperimentHeader({
    experiment,
    user,
    isRTL,
    experimentsByCategory,
    onToggleRightPanel,
    isRightPanelOpen,
    onSave,
    onExport,
    onLogout,
    canSave = false,
    canExport = false
}) {
    const navigate = useNavigate();

    const handleToggleClick = () => {
        console.log('Header: Toggle clicked, current state:', isRightPanelOpen);
        if (onToggleRightPanel) {
            onToggleRightPanel();
        }
    };

    return (
        <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-50 flex-shrink-0">
            <div className="max-w-full mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Left Section - Back button and experiment name */}
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(createPageUrl("Lab"))}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="w-px h-6 bg-slate-300"></span>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                           <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                               <Beaker className="w-5 h-5 text-white" />
                           </div>
                           <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                               {isRTL ? experiment?.i18n_texts?.he?.title : experiment?.i18n_texts?.en?.title}
                           </h1>
                        </div>
                    </div>

                    {/* Middle Section - Save and Export buttons */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onExport}
                            disabled={!canExport}
                        >
                           <Download className="w-4 h-4 mr-2 rtl:ml-2" />
                           <span>{isRTL ? "ייצא" : "Export"}</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onSave}
                            disabled={!canSave}
                        >
                           <Save className="w-4 h-4 mr-2 rtl:ml-2" />
                           <span>{isRTL ? "שמור" : "Save"}</span>
                        </Button>
                    </div>

                    {/* Right Section - Experiments dropdown, user menu, settings */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center">
                                    <span>{isRTL ? "ניסויים" : "Experiments"}</span>
                                    <ChevronDown className="w-4 h-4 ml-2 rtl:mr-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align={isRTL ? "start" : "end"}>
                                <DropdownMenuLabel>{isRTL ? "קטגוריות" : "Categories"}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {experimentsByCategory && Object.keys(experimentsByCategory).length > 0 ? (
                                    Object.entries(experimentsByCategory).map(([category, exps]) => (
                                        <DropdownMenuItem 
                                            key={category}
                                            onClick={() => navigate(createPageUrl(`Lab?category=${category}`))}
                                        >
                                            <div className="flex justify-between w-full">
                                                <span>{isRTL ? categoryNames[category]?.he : categoryNames[category]?.en}</span>
                                                <span className="text-xs text-slate-400">({exps.length})</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <DropdownMenuItem disabled>
                                        {isRTL ? "אין ניסויים זמינים" : "No experiments available"}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-px h-6 bg-slate-300"></div>

                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <User className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? "start" : "end"}>
                                    <DropdownMenuLabel>{user.full_name || user.email}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate(createPageUrl("Dashboard"))}>
                                        <Home className="w-4 h-4 mr-2 rtl:ml-2" />
                                        <span>{isRTL ? "דף הבית" : "Home"}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onLogout}>
                                        <LogOut className="w-4 h-4 mr-2 rtl:ml-2" />
                                        <span>{isRTL ? "התנתק" : "Logout"}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        
                        <Button 
                            variant={isRightPanelOpen ? "secondary" : "outline"} 
                            size="icon" 
                            onClick={handleToggleClick}
                        >
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}