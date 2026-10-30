import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, SlidersHorizontal, Save, Download, User, LogOut, Home, ChevronDown, Info, Sigma
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
import { cn } from "@/lib/utils";
import BlackHoleMark from "@/components/brand/BlackHoleMark";
import {
  categoryNames,
  getExperimentPageUrl,
  groupExperimentsByCategory,
} from "@/components/pagesComponents/lab/labConstants";
import { useTranslation } from "@/i18n";
import type { Bilingual, ExperimentTemplateData, LocalizedTexts } from "@/types/experiment";
import type { AppUser, ExperimentTemplate } from "@/types/models";
import type { IsRTLProps } from "@/types/props";
import { ghostIconButtonClass, plasmaButtonClass, quietButtonClass } from "./workspaceStyles";
import { ExperimentFormulasDialog, ExperimentInfoDialog } from "../guide/ExperimentGuideDialogs";
import type { ExperimentGuide, UnknownSpec } from "@/simulation/guides";

/** The fields the experiments menu reads; raw template rows and typed templates both fit. */
export type ExperimentMenuItem = Pick<ExperimentTemplate, "id" | "slug" | "category" | "i18n_texts">;

type ExperimentHeaderProps = IsRTLProps & {
    experiment?: ExperimentTemplateData | null;
    user?: AppUser | null;
    experiments?: ExperimentMenuItem[];
    experimentsByCategory?: Record<string, ExperimentMenuItem[]>;
    onToggleRightPanel?: () => void;
    isRightPanelOpen?: boolean;
    onSave?: () => void;
    onExport?: () => void;
    onLogout?: () => void;
    canSave?: boolean;
    canExport?: boolean;
    guide?: ExperimentGuide | null;
    /** The parameter hidden in "find the unknown" mode, highlighted in the equations. */
    unknown?: { spec: UnknownSpec; label: string } | null;
};

const categoryLabels: Readonly<Record<string, Partial<Bilingual> | undefined>> = categoryNames;

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
    canExport = false,
    guide = null,
    unknown = null
}: ExperimentHeaderProps) {
    const navigate = useNavigate();
    const { t, pick, menuAlignEnd } = useTranslation(isRTL);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isFormulasOpen, setIsFormulasOpen] = useState(false);
    const title = pick<LocalizedTexts>(experiment?.i18n_texts)?.title || "";
    const groupedExperiments = groupExperimentsByCategory<ExperimentMenuItem>(
        experimentsByCategory ?? experiments ?? []
    );

    const handleToggleClick = () => {
        if (onToggleRightPanel) {
            onToggleRightPanel();
        }
    };

    return (
        <header className="bg-space/80 backdrop-blur-md border-b border-line sticky top-0 z-50 flex-shrink-0 text-star">
            <div className="max-w-full mx-auto px-2 sm:px-4">
                <div className="flex justify-between items-center h-14 gap-1 sm:gap-2">
                    {/* Start section - back button, mark and experiment name */}
                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.backToLab")}
                            onClick={() => navigate(createPageUrl("Lab"))}
                            className={ghostIconButtonClass}
                        >
                            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                        </Button>
                        <span className="w-px h-6 bg-line hidden sm:block" aria-hidden="true"></span>
                        <div className="flex items-center gap-2.5 min-w-0">
                           <BlackHoleMark className="h-7 w-7 flex-shrink-0" />
                           <h1 className="text-[17px] font-medium text-star hidden sm:block truncate">
                               {title}
                           </h1>
                        </div>
                        {/* About the experiment, and the equations behind it */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsInfoOpen(true)}
                            aria-label={t("workspace.info.button")}
                            aria-haspopup="dialog"
                            className={cn("px-2 sm:px-3", quietButtonClass)}
                        >
                            <Info className="w-4 h-4" />
                            <span className="hidden lg:inline">{t("workspace.info.button")}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFormulasOpen(true)}
                            aria-label={t("workspace.formulas.button")}
                            aria-haspopup="dialog"
                            className={cn("px-2 sm:px-3", quietButtonClass)}
                        >
                            <Sigma className="w-4 h-4" />
                            <span className="hidden lg:inline">{t("workspace.formulas.button")}</span>
                        </Button>
                    </div>

                    {/* Middle section - export (secondary) and save (the one primary action) */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            disabled={!canExport}
                            aria-label={t("common.export")}
                            className={cn("px-2 sm:px-3", quietButtonClass)}
                        >
                           <Download className="w-4 h-4" />
                           <span className="hidden sm:inline">{t("common.export")}</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={onSave}
                            disabled={!canSave}
                            aria-label={t("common.save")}
                            className={cn("px-2 sm:px-3", plasmaButtonClass)}
                        >
                           <Save className="w-4 h-4" />
                           <span className="hidden sm:inline">{t("common.save")}</span>
                        </Button>
                    </div>

                    {/* End section - experiments menu, user menu, panel toggle */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("flex items-center px-2.5 sm:px-3", quietButtonClass)}>
                                    <span>{t("common.experiments")}</span>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 max-w-[calc(100vw-2rem)] bg-space-raised border-line" align={menuAlignEnd}>
                                <DropdownMenuLabel className="text-dust font-medium">{t("common.categories")}</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-line" />
                                {Object.keys(groupedExperiments).length > 0 ? (
                                    Object.entries(groupedExperiments).map(([category, exps]) => (
                                        <div key={category}>
                                            <DropdownMenuItem
                                                onClick={() => navigate(createPageUrl(`Lab?category=${category}`))}
                                            >
                                                <div className="flex justify-between w-full font-medium text-star">
                                                    <span>{pick(categoryLabels[category], category)}</span>
                                                    <span className="text-xs font-mono tabular-nums text-dust">({exps.length})</span>
                                                </div>
                                            </DropdownMenuItem>
                                            {exps.map((exp) => (
                                                <DropdownMenuItem
                                                    key={exp.id || exp.slug}
                                                    onClick={() => navigate(getExperimentPageUrl(exp.slug), { state: { experiment: exp } })}
                                                    className="ps-6 text-xs text-dust focus:text-star"
                                                >
                                                    <span className="w-1 h-1 rounded-full bg-blueshift me-2 flex-shrink-0" aria-hidden="true" />
                                                    <span className="truncate">{pick<LocalizedTexts>(exp.i18n_texts)?.title || exp.slug}</span>
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

                        <div className="w-px h-6 bg-line hidden sm:block" aria-hidden="true"></div>

                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn("rounded-full", ghostIconButtonClass)} aria-label={t("workspace.userMenu")}>
                                        <User className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={menuAlignEnd} className="bg-space-raised border-line">
                                    <DropdownMenuLabel className="text-dust font-medium">{user.full_name || user.email}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-line" />
                                    <DropdownMenuItem onClick={() => navigate(createPageUrl("Dashboard"))}>
                                        <Home className="w-4 h-4 me-2 text-dust" />
                                        <span>{t("common.home")}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onLogout}>
                                        <LogOut className="w-4 h-4 me-2 text-dust" />
                                        <span>{t("common.logout")}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button
                            variant="outline"
                            size="icon"
                            aria-label={t("workspace.toggleSidePanel")}
                            aria-pressed={!!isRightPanelOpen}
                            onClick={handleToggleClick}
                            className={cn(
                                quietButtonClass,
                                isRightPanelOpen && "border-blueshift/60 bg-blueshift/10 text-blueshift"
                            )}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
            <ExperimentInfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} texts={experiment?.i18n_texts} />
            <ExperimentFormulasDialog
                open={isFormulasOpen}
                onOpenChange={setIsFormulasOpen}
                title={title}
                guide={guide}
                unknown={unknown}
            />
        </header>
    );
}
