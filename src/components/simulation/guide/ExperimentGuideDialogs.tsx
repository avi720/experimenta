import { lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";
import type { ExperimentAbout, ExperimentGuide, UnknownSpec } from "@/simulation/guides";
import type { LocalizedTexts, I18nTexts } from "@/types/experiment";

const FormulasContent = lazy(() => import("./FormulasContent"));

type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const sectionTitleClass = "text-sm font-semibold text-plasma";

/**
 * About the experiment: what it is, its history, what it shows and the question behind it (from the
 * guide in code), then the template's steps and safety notes. Without a guide, the template's short text.
 */
export function ExperimentInfoDialog({ open, onOpenChange, texts, about }: DialogProps & {
    texts?: I18nTexts | null;
    about?: ExperimentAbout | null;
}) {
    const { t, pick } = useTranslation();
    const localized = pick<LocalizedTexts>(texts);
    const steps = (localized?.steps || []).filter(Boolean);
    const aboutSections = about
        ? [
              { title: t("workspace.info.whatTitle"), text: pick(about.what) },
              { title: t("workspace.info.historyTitle"), text: pick(about.history) },
              { title: t("workspace.info.showsTitle"), text: pick(about.shows) },
              { title: t("workspace.info.questionTitle"), text: pick(about.question) },
          ]
        : [];
    const hasContent = aboutSections.length > 0 || !!localized?.short_desc || steps.length > 0 || !!localized?.safety_notes;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent closeLabel={t("common.closeDialog")} className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{localized?.title || t("workspace.info.title")}</DialogTitle>
                    <DialogDescription className="sr-only">{t("workspace.info.title")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
                    {!hasContent && <p className="text-dust">{t("workspace.info.empty")}</p>}
                    {!about && localized?.short_desc && <p className="text-star">{localized.short_desc}</p>}
                    {aboutSections.map(({ title, text }) => (
                        <section key={title} className="space-y-1.5">
                            <h3 className={sectionTitleClass}>{title}</h3>
                            <p className="text-star">{text}</p>
                        </section>
                    ))}
                    {steps.length > 0 && (
                        <section className="space-y-2">
                            <h3 className={sectionTitleClass}>{t("workspace.info.stepsTitle")}</h3>
                            <ol className="list-decimal space-y-1.5 ps-5 text-star">
                                {steps.map((step) => <li key={step}>{step}</li>)}
                            </ol>
                        </section>
                    )}
                    {localized?.safety_notes && (
                        <section className="space-y-2">
                            <h3 className={sectionTitleClass}>{t("workspace.info.safetyTitle")}</h3>
                            <p className="text-star">{localized.safety_notes}</p>
                        </section>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

type FormulasDialogProps = DialogProps & {
    title: string;
    guide: ExperimentGuide | null;
    unknown?: { spec: UnknownSpec; label: string } | null;
};

/** The equations behind the experiment, rendered with KaTeX (loaded on first open). */
export function ExperimentFormulasDialog({ open, onOpenChange, title, guide, unknown }: FormulasDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent closeLabel={t("common.closeDialog")}>
                <DialogHeader>
                    <DialogTitle>{t("workspace.formulas.title", { title })}</DialogTitle>
                    <DialogDescription>{t("workspace.formulas.description")}</DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto px-5 py-4">
                    {guide && guide.formulas.length > 0 ? (
                        <Suspense fallback={<p className="text-sm text-dust">{t("workspace.formulas.loading")}</p>}>
                            <FormulasContent guide={guide} unknown={unknown} />
                        </Suspense>
                    ) : (
                        <p className="text-sm text-dust">{t("workspace.formulas.empty")}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
