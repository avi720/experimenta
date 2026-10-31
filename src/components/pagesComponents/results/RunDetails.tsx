import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { ExperimentRun } from "@/types/models";
import { downloadCsv } from "@/lib/csv";
import { exportStoredSamplesCsv } from "@/lib/simulationExport";
import { formatRunDate } from "./resultsDomain";
import { errorBannerClass, panelClass } from "./resultsStyles";
import OverviewTab from "./OverviewTab";
import DataTab from "./DataTab";
import ChartsTab from "./ChartsTab";
import AnalysisTab from "./AnalysisTab";
import CompareTab from "./CompareTab";
import type { RunAnalysis } from "./useRunAnalysis";

const tabTriggerClass =
  "focus-ring -mb-px h-11 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-0 text-sm font-normal text-dust shadow-none transition-colors hover:text-star focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-plasma data-[state=active]:bg-transparent data-[state=active]:text-star data-[state=active]:shadow-none";

/** A small empty-state figure: an axis with a dashed trace still to be recorded. */
function EmptyTraceFigure() {
  return (
    <svg viewBox="0 0 96 64" className="w-24 h-16" aria-hidden="true">
      <path d="M8 4 V56 H92" stroke="rgb(var(--line))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path
        d="M10 50 C 30 48, 44 36, 56 24 S 80 8, 90 6"
        stroke="rgb(var(--blueshift) / 0.7)"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Right-hand panel: empty state, or the tabs for the selected run. */
export default function RunDetails({ analysis, runs }: { analysis: RunAnalysis; runs: readonly ExperimentRun[] }) {
  const { t, dir } = useTranslation();
  const [currentTab, setCurrentTab] = useState("overview");
  const { selectedRun, paramState, samples, chartConfig } = analysis;

  if (!selectedRun) {
    return (
      <section className={`${panelClass} min-h-[24rem] flex items-center justify-center px-6 py-16`}>
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <EmptyTraceFigure />
          </div>
          <h3 className="text-xl font-light text-star mb-2">
            {t('results.selectExperimentTitle')}
          </h3>
          <p className="text-sm leading-relaxed text-dust">
            {t('results.selectExperimentDescription')}
          </p>
        </div>
      </section>
    );
  }

  const exportCsv = () => {
    if (!samples.length) return;
    downloadCsv(exportStoredSamplesCsv(samples), `${selectedRun.experiment_slug}_${selectedRun.id}.csv`);
  };

  return (
    <section className={panelClass} aria-labelledby="run-details-title">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 sm:px-6 pt-5">
        <h2 id="run-details-title" className="text-[22px] font-light text-star break-all">
          {selectedRun.experiment_slug}
        </h2>
        <p className="font-mono tabular-nums text-xs text-dust" dir="ltr">
          {formatRunDate(selectedRun.created_date, 'dd/MM/yyyy HH:mm')}
        </p>
      </header>

      {paramState.error && (
        <div role="alert" className={`${errorBannerClass} mx-5 sm:mx-6 mt-4 flex items-start gap-3 rounded-md px-4 py-3`}>
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <h5 className="font-medium leading-none">
              {t('results.corruptedParamsTitle')}
            </h5>
            <p className="mt-1.5 text-sm text-danger/80">
              {t('results.corruptedParamsDescription')}
            </p>
          </div>
        </div>
      )}

      <Tabs dir={dir} value={currentTab} onValueChange={setCurrentTab} className="mt-2">
        <TabsList className="flex h-auto w-full justify-start gap-6 sm:gap-8 overflow-x-auto rounded-none border-b border-line bg-transparent p-0 px-5 sm:px-6 text-dust">
          <TabsTrigger value="overview" className={tabTriggerClass}>{t('results.overviewTab')}</TabsTrigger>
          <TabsTrigger value="data" className={tabTriggerClass}>{t('results.dataTab')}</TabsTrigger>
          <TabsTrigger value="charts" className={tabTriggerClass}>{t('results.chartsTab')}</TabsTrigger>
          <TabsTrigger value="compare" className={tabTriggerClass}>{t('results.compareTab')}</TabsTrigger>
          <TabsTrigger value="analysis" className={tabTriggerClass}>{t('results.analysisTab')}</TabsTrigger>
        </TabsList>

        <div className="px-5 sm:px-6 py-6">
          <TabsContent value="overview" className="focus-ring mt-0 space-y-8 focus-visible:ring-0 focus-visible:ring-offset-0">
            <OverviewTab run={selectedRun} samples={samples} paramState={paramState} />
          </TabsContent>

          <TabsContent value="data" className="focus-ring mt-0 space-y-8 focus-visible:ring-0 focus-visible:ring-offset-0">
            <DataTab samples={samples} onExportCsv={exportCsv} />
          </TabsContent>

          <TabsContent value="charts" className="focus-ring mt-0 space-y-8 focus-visible:ring-0 focus-visible:ring-offset-0">
            <ChartsTab
              chartConfig={chartConfig}
              axisOptions={analysis.axisOptions}
              formulas={analysis.formulas}
              chartData={analysis.chartData}
              hasTheoreticalSeries={analysis.hasTheoreticalSeries}
              onChartConfigChange={analysis.updateChartConfig}
              onFormulaChange={analysis.selectFormula}
            />
          </TabsContent>

          <TabsContent value="compare" className="focus-ring mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <CompareTab
              run={selectedRun}
              samples={samples}
              paramState={paramState}
              runs={runs}
            />
          </TabsContent>

          <TabsContent value="analysis" className="focus-ring mt-0 space-y-8 focus-visible:ring-0 focus-visible:ring-offset-0">
            <AnalysisTab
              statistics={analysis.statistics}
              chartConfig={chartConfig}
              chartData={analysis.chartData}
            />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
