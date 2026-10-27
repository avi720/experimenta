import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/i18n";
import { useExperimentRunMutations, useExperimentRunsQuery } from "@/hooks/useDataQueries";
import { filterRunsByCriteria } from "@/components/pagesComponents/results/resultsDomain";
import { useRunAnalysis } from "@/components/pagesComponents/results/useRunAnalysis";
import ResultsHeader from "@/components/pagesComponents/results/ResultsHeader";
import ResultsFilters from "@/components/pagesComponents/results/ResultsFilters";
import RunsList from "@/components/pagesComponents/results/RunsList";
import RunDetails from "@/components/pagesComponents/results/RunDetails";
import DeleteRunDialog from "@/components/pagesComponents/results/DeleteRunDialog";

const EMPTY_RUNS = [];

export default function Results() {
  const { user } = useAuth();
  const { t, dir } = useTranslation();
  const runsQuery = useExperimentRunsQuery(user?.id);
  const { deleteRun } = useExperimentRunMutations();
  const analysis = useRunAnalysis();
  const { selectedRun, selectRun, clearRunIfSelected } = analysis;

  const [filters, setFilters] = useState({ experiment: 'all', dateRange: 'all' });
  const [runPendingDelete, setRunPendingDelete] = useState(null);
  const [isDeletingRun, setIsDeletingRun] = useState(false);

  const runs = Array.isArray(runsQuery.data) ? runsQuery.data : EMPTY_RUNS;
  const hasLoadError = runsQuery.isError;
  const refetchRuns = () => runsQuery.refetch();

  const filteredRuns = useMemo(() => filterRunsByCriteria(runs, filters), [runs, filters]);

  const confirmDeleteRun = async () => {
    if (!runPendingDelete) return;
    const runId = runPendingDelete.id;
    setIsDeletingRun(true);
    try {
      // The mutation invalidates the runs query, so the list refreshes on its own.
      await deleteRun(runId);
      clearRunIfSelected(runId);
      toast.success(t("results.runDeletedToast"));
      setRunPendingDelete(null);
    } catch (error) {
      console.error("Error deleting run:", error);
      toast.error(t("results.runDeleteErrorToast"));
    } finally {
      setIsDeletingRun(false);
    }
  };

  if (runsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">{t('common.loadingResults')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={dir}>
      <ResultsHeader hasLoadError={hasLoadError} onRefresh={refetchRuns} />

      <ResultsFilters
        runs={runs}
        filters={filters}
        onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        resultsCount={filteredRuns.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RunsList
          runs={filteredRuns}
          showLoadFailure={hasLoadError && runs.length === 0}
          selectedRunId={selectedRun?.id}
          onSelectRun={selectRun}
          onRequestDelete={setRunPendingDelete}
          onRetry={refetchRuns}
        />

        <div className="lg:col-span-2">
          <RunDetails analysis={analysis} />
        </div>
      </div>

      <DeleteRunDialog
        open={Boolean(runPendingDelete)}
        isDeleting={isDeletingRun}
        onCancel={() => setRunPendingDelete(null)}
        onConfirm={confirmDeleteRun}
      />
    </div>
  );
}
