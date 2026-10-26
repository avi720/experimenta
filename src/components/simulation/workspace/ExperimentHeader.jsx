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
import {
  categoryNames,
  getExperimentPageUrl,
  groupExperimentsByCategory,
} from "@/components/pagesComponents/lab/labConstants";
import { useTranslation } from "@/i18n";

export default function ExperimentHeader({
    experiment,
    user,
    isRTL,
    experiments,
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
    const { t, pick, alignEnd } = useTranslation(isRTL);
    const groupedExperiments = groupExperimentsByCategory(
        experimentsByCategory ?? experiments ?? []
    );

    const handleToggleClick = () => {
        if (onToggleRightPanel) {
            onToggleRightPanel();
        }
    };

    return (
        <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-50 flex-shrink-0">
            <div className="max-w-full mx-auto px-2 sm:px-4">
                <div className="flex justify-between items-center h-14 sm:h-16 gap-1 sm:gap-2">
                    {/* Left Section - Back button and experiment name */}
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.backToLab")}
                            onClick={() => navigate(createPageUrl("Lab"))}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="w-px h-6 bg-slate-300 hidden sm:block"></span>
                        <div className="flex items-center gap-2 min-w-0">
                           <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Beaker className="w-5 h-5 text-white" />
                           </div>
                           <h1 className="text-lg font-semibold text-slate-800 hidden sm:block truncate">
                               {pick(experiment?.i18n_texts)?.title}
                           </h1>
                        </div>
                    </div>

                    {/* Middle Section - Save and Export buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            disabled={!canExport}
                            aria-label={t("common.export")}
                            className="px-2 sm:px-3"
                        >
                           <Download className="w-4 h-4 sm:me-2" />
                           <span className="hidden sm:inline">{t("common.export")}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSave}
                            disabled={!canSave}
                            aria-label={t("common.save")}
                            className="px-2 sm:px-3"
                        >
                           <Save className="w-4 h-4 sm:me-2" />
                           <span className="hidden sm:inline">{t("common.save")}</span>
                        </Button>
                    </div>

                    {/* Right Section - Experiments dropdown, user menu, settings */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center px-2.5 sm:px-3">
                                    <span>{t("common.experiments")}</span>
                                    <ChevronDown className="w-4 h-4 ms-1.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 max-w-[calc(100vw-2rem)]" align={alignEnd}>
                                <DropdownMenuLabel>{t("common.categories")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.keys(groupedExperiments).length > 0 ? (
                                    Object.entries(groupedExperiments).map(([category, exps]) => (
                                        <div key={category}>
                                            <DropdownMenuItem
                                                onClick={() => navigate(createPageUrl(`Lab?category=${category}`))}
                                            >
                                                <div className="flex justify-between w-full font-medium">
                                                    <span>{pick(categoryNames[category], category)}</span>
                                                    <span className="text-xs text-slate-400">({exps.length})</span>
                                                </div>
                                            </DropdownMenuItem>
                                            {exps.map((exp) => (
                                                <DropdownMenuItem
                                                    key={exp.id || exp.slug}
                                                    onClick={() => navigate(getExperimentPageUrl(exp.slug), { state: { experiment: exp } })}
                                                    className="ps-6 text-xs text-slate-600"
                                                >
                                                    <Beaker className="w-3 h-3 me-2 text-blue-500 flex-shrink-0" />
                                                    <span className="truncate">{pick(exp.i18n_texts)?.title || exp.slug}</span>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <DropdownMenuItem disabled>
                                        {t("workspace.noExperimentsAvailable")}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-px h-6 bg-slate-300 hidden sm:block"></div>

                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("workspace.userMenu")}>
                                        <User className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={alignEnd}>
                                    <DropdownMenuLabel>{user.full_name || user.email}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate(createPageUrl("Dashboard"))}>
                                        <Home className="w-4 h-4 me-2" />
                                        <span>{t("common.home")}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onLogout}>
                                        <LogOut className="w-4 h-4 me-2" />
                                        <span>{t("common.logout")}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button
                            variant={isRightPanelOpen ? "secondary" : "outline"}
                            size="icon"
                            aria-label={t("workspace.toggleSidePanel")}
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
