import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { useTranslation } from "@/i18n";
import { downloadCsv, samplesToCsv } from "@/lib/csv";
import OverviewTab from "./OverviewTab";
import DataTab from "./DataTab";
import ChartsTab from "./ChartsTab";
import AnalysisTab from "./AnalysisTab";
import type { RunAnalysis } from "./useRunAnalysis";

/** Right-hand panel: empty state, or the four tabs for the selected run. */
export default function RunDetails({ analysis }: { analysis: RunAnalysis }) {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState("overview");
  const { selectedRun, paramState, samples, chartConfig } = analysis;

  if (!selectedRun) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            {t('results.selectExperimentTitle')}
          </h3>
          <p className="text-slate-500">
            {t('results.selectExperimentDescription')}
          </p>
        </div>
      </Card>
    );
  }

  const exportCsv = () => {
    if (!samples.length) return;
    downloadCsv(samplesToCsv(samples), `${selectedRun.experiment_slug}_${selectedRun.id}.csv`);
  };

  return (
    <div className="space-y-4">
      {paramState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {t('results.corruptedParamsTitle')}
          </AlertTitle>
          <AlertDescription>
            {t('results.corruptedParamsDescription')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('results.overviewTab')}</TabsTrigger>
          <TabsTrigger value="data">{t('results.dataTab')}</TabsTrigger>
          <TabsTrigger value="charts">{t('results.chartsTab')}</TabsTrigger>
          <TabsTrigger value="analysis">{t('results.analysisTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab run={selectedRun} samples={samples} paramState={paramState} />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataTab samples={samples} onExportCsv={exportCsv} />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
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

        <TabsContent value="analysis" className="space-y-4">
          <AnalysisTab
            statistics={analysis.statistics}
            chartConfig={chartConfig}
            chartData={analysis.chartData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
