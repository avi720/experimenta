import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ExperimentRun } from "@/entities/ExperimentRun";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3, Download, Eye, Trash2, Filter, RefreshCw, AlertTriangle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useAppData } from "@/components/hooks/useAppData";
import { resolveExperimentRegistryEntry } from "@/components/simulation/experimentRegistry";
import {
  parseStoredSimulationSamples,
  serializeSimulationSamples,
} from "@/components/hooks/simulation/useExperimentPersistence";

const pickNum = (val, fallback) => {
  const num = parseFloat(val);
  return Number.isNaN(num) ? fallback : num;
};

/**
 * Safely parses `run.parameters_json` without throwing during render.
 * Returns `{ parameters, error }` where `error` is non-null when JSON is malformed
 * or does not represent a plain parameter object.
 */
export function parseRunParameters(parametersJson) {
  if (parametersJson === null || parametersJson === undefined || parametersJson === '') {
    return { parameters: {}, error: null };
  }
  if (typeof parametersJson === 'object') {
    if (Array.isArray(parametersJson)) {
      return { parameters: {}, error: 'malformed_parameters_json' };
    }
    return { parameters: parametersJson, error: null };
  }
  if (typeof parametersJson !== 'string') {
    return { parameters: {}, error: 'malformed_parameters_json' };
  }
  try {
    const parsed = JSON.parse(parametersJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { parameters: {}, error: 'malformed_parameters_json' };
    }
    return { parameters: parsed, error: null };
  } catch {
    return { parameters: {}, error: 'malformed_parameters_json' };
  }
}

/**
 * Formats arbitrary parameter or table cell values safely so objects/arrays never crash React.
 */
export function formatDisplayValue(value, precision = 3) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toFixed(precision) : String(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Filters runs by experiment slug and date range (`all` | `today` | `week` | `month`).
 */
export function filterRunsByCriteria(runs, filters, now = new Date()) {
  if (!Array.isArray(runs)) return [];
  const experimentFilter = filters?.experiment || 'all';
  const dateRange = filters?.dateRange || 'all';

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const nowMs = now.getTime();
  const weekAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const monthAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

  return runs.filter((run) => {
    if (experimentFilter !== 'all' && run.experiment_slug !== experimentFilter) {
      return false;
    }
    if (dateRange === 'all') {
      return true;
    }
    const createdMs = new Date(run.created_date).getTime();
    if (Number.isNaN(createdMs)) {
      return false;
    }
    if (dateRange === 'today') {
      return createdMs >= startOfToday;
    }
    if (dateRange === 'week') {
      return createdMs >= weekAgoMs;
    }
    if (dateRange === 'month') {
      return createdMs >= monthAgoMs;
    }
    return true;
  });
}

function formatRunDate(dateStr, pattern) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr || '');
    return format(d, pattern);
  } catch {
    return String(dateStr || '');
  }
}

// נוסחאות פיזיקליות מוגדרות מראש (ללא גרר/ריסון — להשוואה תיאורטית מול נתוני הסימולציה שנשמרו)
const physicsFormulas = {
  'free-fall': [
    {
      id: 'position_vs_time',
      name_he: 'מיקום כתלות בזמן (ריק)',
      name_en: 'Position vs Time (Vacuum)',
      formula: 'h = h₀ + v₀t - ½gt²',
      axes: ['time', 'position', 'theoretical_position'],
      calculate: (data, params) => {
        const h0 = pickNum(params.h0, 50);
        const v0 = pickNum(params.v0, 0);
        const g = pickNum(params.g, 9.81);
        return data.map(point => ({
          ...point,
          theoretical_position: Math.max(0, h0 + v0 * point.time - 0.5 * g * Math.pow(point.time, 2))
        }));
      }
    },
    {
      id: 'velocity_vs_time',
      name_he: 'מהירות כתלות בזמן (ריק)',
      name_en: 'Velocity vs Time (Vacuum)',
      formula: 'v = v₀ - gt',
      axes: ['time', 'velocity', 'theoretical_velocity'],
      calculate: (data, params) => {
        const v0 = pickNum(params.v0, 0);
        const g = pickNum(params.g, 9.81);
        return data.map(point => ({
          ...point,
          theoretical_velocity: v0 - g * point.time
        }));
      }
    },
    {
      id: 'energy_conservation',
      name_he: 'שימור אנרגיה (ריק)',
      name_en: 'Energy Conservation (Vacuum)',
      formula: 'E₀ = ½mv₀² + mgh₀',
      axes: ['time', 'energy_kinetic', 'energy_potential', 'energy_total', 'theoretical_energy'],
      calculate: (data, params) => {
        const h0 = pickNum(params.h0, 50);
        const v0 = pickNum(params.v0, 0);
        const g = pickNum(params.g, 9.81);
        const m = pickNum(params.m, 1);
        const initialEnergy = 0.5 * m * v0 * v0 + m * g * h0;
        return data.map(point => ({
          ...point,
          energy_total: point.energy_total ?? (point.energy_kinetic + point.energy_potential),
          theoretical_energy: initialEnergy
        }));
      }
    }
  ],
  'sho': [
    {
      id: 'sho_position',
      name_he: 'מתנד הרמוני אידיאלי - מיקום',
      name_en: 'Ideal SHO Position',
      formula: 'x = x₀ cos(ω₀t) + (v₀/ω₀) sin(ω₀t)',
      axes: ['time', 'position', 'theoretical_position'],
      calculate: (data, params) => {
        const k = pickNum(params.k, 10);
        const m = pickNum(params.m, 1);
        const x0 = pickNum(params.x0, 1);
        const v0 = pickNum(params.v0, 0);
        const omega = Math.sqrt(k / m);
        return data.map(point => ({
          ...point,
          theoretical_position: x0 * Math.cos(omega * point.time) + (omega > 0 ? (v0 / omega) * Math.sin(omega * point.time) : 0)
        }));
      }
    }
  ]
};

/**
 * Reconstructs run samples from the real physics engine only for legacy rows
 * that were saved before `results_url` stored the actual sample array.
 */
function reconstructLegacyRunSamples(experimentSlug, parameters) {
  const entry = resolveExperimentRegistryEntry(experimentSlug);
  if (!entry) return [];

  if (entry.mode === 'static' && typeof entry.calculateStaticFn === 'function') {
    const mergedParams = { ...(entry.defaultParameters || {}), ...(parameters || {}) };
    const result = entry.calculateStaticFn(mergedParams);
    return Array.isArray(result) ? serializeSimulationSamples(result) : [];
  }

  if (typeof entry.calculateStepFn === 'function') {
    const parsedTMax = parseFloat(parameters?.t_max);
    const maxTime = !Number.isNaN(parsedTMax) && parsedTMax > 0
      ? parsedTMax
      : entry.defaultMaxTime ?? 10;
    const dt = 0.001;
    const raw = [];
    for (let t = 0; t <= maxTime + 1e-9; t += dt) {
      const point = entry.calculateStepFn(Number(t.toFixed(6)), parameters || {});
      raw.push(point);
      if (point?.shouldStop) break;
    }
    return serializeSimulationSamples(raw);
  }

  return [];
}

export default function Results() {
  const { user } = useAuth();
  const { isRTL } = useAppData();
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [simulationData, setSimulationData] = useState([]);
  const [currentTab, setCurrentTab] = useState("overview");
  const [runPendingDelete, setRunPendingDelete] = useState(null);
  const [isDeletingRun, setIsDeletingRun] = useState(false);

  // Chart configuration
  const [chartConfig, setChartConfig] = useState({
    xAxis: 'time',
    yAxis: 'position',
    showTheoretical: false,
    selectedFormula: null,
  });

  // Filters
  const [filters, setFilters] = useState({
    experiment: 'all',
    dateRange: 'all'
  });

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      // RLS lets admins read every run; this page shows only the current user's own runs.
      const runsList = await ExperimentRun.filter({ created_by: user.id }, '-created_date');
      setRuns(Array.isArray(runsList) ? runsList : []);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoadError(error?.message || "Failed to load saved runs");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id, loadData]);

  const confirmDeleteRun = async () => {
    if (!runPendingDelete) return;
    const runId = runPendingDelete.id;
    setIsDeletingRun(true);
    try {
      await ExperimentRun.delete(runId);
      if (selectedRun?.id === runId) {
        setSelectedRun(null);
        setSimulationData([]);
      }
      toast.success(isRTL ? "הריצה נמחקה בהצלחה" : "Run deleted successfully");
      setRunPendingDelete(null);
      await loadData();
    } catch (error) {
      console.error("Error deleting run:", error);
      toast.error(isRTL ? "שגיאה במחיקת הריצה." : "Error deleting run.");
    } finally {
      setIsDeletingRun(false);
    }
  };

  const loadRunData = (run) => {
    setSelectedRun(run);

    const { parameters, error: paramParseError } = parseRunParameters(run.parameters_json);

    // Prefer the exact stored sample array in `results_url`; fall back to the real engine for legacy runs
    // only when parameters parsed cleanly.
    const storedSamples = parseStoredSimulationSamples(run.results_url);
    const sampleData = storedSamples ?? (paramParseError ? [] : reconstructLegacyRunSamples(run.experiment_slug, parameters));
    setSimulationData(sampleData);

    const firstPoint = sampleData[0] || {};
    const defaultXAxis = typeof firstPoint.time === 'number' ? 'time' : Object.keys(firstPoint)[0] || 'time';
    const availableNumericKeys = Object.keys(firstPoint).filter(
      (k) => k !== defaultXAxis && typeof firstPoint[k] === 'number'
    );
    const formulaDefaultY = physicsFormulas[run.experiment_slug]?.[0]?.axes[1];
    const defaultYAxis =
      formulaDefaultY && availableNumericKeys.includes(formulaDefaultY)
        ? formulaDefaultY
        : availableNumericKeys[0] || 'position';

    setChartConfig(prev => ({
      ...prev,
      selectedFormula: physicsFormulas[run.experiment_slug]?.[0] || null,
      xAxis: defaultXAxis,
      yAxis: defaultYAxis
    }));
  };

  const selectedRunParamState = useMemo(
    () => (selectedRun ? parseRunParameters(selectedRun.parameters_json) : { parameters: {}, error: null }),
    [selectedRun]
  );

  const getAvailableDataKeys = () => {
    if (!simulationData.length) return [];
    return Object.keys(simulationData[0]).filter(key =>
      key !== 'time' && typeof simulationData[0][key] === 'number'
    );
  };

  const getChartAxisOptions = () => {
    if (chartConfig.selectedFormula?.axes) {
      return chartConfig.selectedFormula.axes.filter(key => {
        const baseKey = key.replace('theoretical_', '');
        return simulationData.length > 0 && Object.prototype.hasOwnProperty.call(simulationData[0], baseKey);
      });
    }
    return getAvailableDataKeys().concat(['time']);
  };

  const chartData = useMemo(() => {
    if (!simulationData.length) return [];

    let data = [...simulationData];

    if (
      chartConfig.showTheoretical &&
      chartConfig.selectedFormula &&
      selectedRun &&
      !selectedRunParamState.error
    ) {
      data = chartConfig.selectedFormula.calculate(data, selectedRunParamState.parameters);

      const yAxisKey = chartConfig.yAxis;
      if (data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], `theoretical_${yAxisKey}`)) {
        data = data.map(d => ({ ...d, theoretical_yAxis: d[`theoretical_${yAxisKey}`] }));
      }
    }

    return data;
  }, [simulationData, chartConfig, selectedRun, selectedRunParamState]);

  const exportRunData = (exportFormat) => {
    if (!selectedRun || !simulationData.length) return;

    if (exportFormat === 'csv') {
      const headers = Object.keys(simulationData[0]).join(',');
      const rows = simulationData.map(row => Object.values(row).map(v => formatDisplayValue(v, 6)).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedRun.experiment_slug}_${selectedRun.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const filteredRuns = useMemo(
    () => filterRunsByCriteria(runs, filters),
    [runs, filters]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">{isRTL ? "טוען תוצאות..." : "Loading results..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {isRTL ? "תוצאות ניסויים" : "Experiment Results"}
          </h1>
          <p className="text-slate-600 mt-2">
            {isRTL ? "ניתוח ועיבוד נתוני הניסויים השמורים" : "Analysis and processing of saved experiment data"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {isRTL ? "רענן" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Load error banner with Retry */}
      {loadError && (
        <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <AlertTitle>
                {isRTL ? "שגיאה בטעינת התוצאות השמורות" : "Failed to load saved results"}
              </AlertTitle>
              <AlertDescription>
                {isRTL
                  ? "לא ניתן היה לטעון את הריצות השמורות מהשרת. בדוק את החיבור לאינטרנט ונסה שוב."
                  : "Could not load your saved runs from the server. Check your connection and try again."}
              </AlertDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="self-start sm:self-center gap-2 bg-white text-slate-900 hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
            {isRTL ? "נסה שוב" : "Try Again"}
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {isRTL ? "מסננים" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>{isRTL ? "ניסוי" : "Experiment"}</Label>
            <Select value={filters.experiment} onValueChange={(value) => setFilters(prev => ({ ...prev, experiment: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "כל הניסויים" : "All Experiments"}</SelectItem>
                {[...new Set(runs.map(run => run.experiment_slug).filter(Boolean))].map(slug => (
                  <SelectItem key={String(slug)} value={String(slug)}>{String(slug)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{isRTL ? "תאריך" : "Date Range"}</Label>
            <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "כל התאריכים" : "All Dates"}</SelectItem>
                <SelectItem value="today">{isRTL ? "היום" : "Today"}</SelectItem>
                <SelectItem value="week">{isRTL ? "השבוע" : "This Week"}</SelectItem>
                <SelectItem value="month">{isRTL ? "החודש" : "This Month"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Badge variant="outline" className="h-10 flex items-center">
              {filteredRuns.length} {isRTL ? "תוצאות" : "results"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs List */}
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "ריצות שמורות" : "Saved Runs"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {loadError && runs.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-red-600 text-sm">
                  {isRTL ? "טעינת הריצות נכשלה." : "Loading runs failed."}
                </p>
                <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {isRTL ? "נסה שוב" : "Try Again"}
                </Button>
              </div>
            ) : filteredRuns.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                {isRTL ? "אין תוצאות שמורות" : "No saved results found"}
              </p>
            ) : (
              filteredRuns.map((run) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedRun?.id === run.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => loadRunData(run)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{run.experiment_slug}</h4>
                      <p className="text-xs text-slate-500">
                        {formatRunDate(run.created_date, 'dd/MM/yyyy HH:mm')}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {run.samples_count} {isRTL ? "נקודות" : "samples"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={isRTL ? "צפייה בריצה" : "View run"}
                        onClick={(e) => {
                          e.stopPropagation();
                          loadRunData(run);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={isRTL ? "מחיקת ריצה" : "Delete run"}
                        className="text-red-500 hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRunPendingDelete(run);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {!selectedRun ? (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  {isRTL ? "בחר ניסוי לצפייה" : "Select an Experiment to View"}
                </h3>
                <p className="text-slate-500">
                  {isRTL ? "לחץ על אחד הניסויים מהרשימה כדי לראות את התוצאות" : "Click on an experiment from the list to see the results"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {selectedRunParamState.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {isRTL ? "נתוני פרמטרים פגומים" : "Corrupted Parameter Data"}
                  </AlertTitle>
                  <AlertDescription>
                    {isRTL
                      ? "נתוני הפרמטרים של ריצה זו (parameters_json) אינם בפורמט JSON תקין. לא ניתן להציג את הפרמטרים או לחשב עקומה תיאורטית עבור ריצה זו."
                      : "The parameter JSON stored for this run (parameters_json) is malformed. Parameters and theoretical curves cannot be computed for this run."}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">{isRTL ? "סקירה" : "Overview"}</TabsTrigger>
                  <TabsTrigger value="data">{isRTL ? "נתונים" : "Data"}</TabsTrigger>
                  <TabsTrigger value="charts">{isRTL ? "גרפים" : "Charts"}</TabsTrigger>
                  <TabsTrigger value="analysis">{isRTL ? "ניתוח" : "Analysis"}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{isRTL ? "פרטי הניסוי" : "Experiment Details"}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-500">{isRTL ? "סוג ניסוי" : "Experiment Type"}</Label>
                        <p className="font-medium">{selectedRun.experiment_slug}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-500">{isRTL ? "תאריך ושעה" : "Date & Time"}</Label>
                        <p className="font-medium">{formatRunDate(selectedRun.created_date, 'dd/MM/yyyy HH:mm:ss')}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-500">{isRTL ? "מספר דגימות" : "Samples Count"}</Label>
                        <p className="font-medium">{simulationData.length || selectedRun.samples_count}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-500">{isRTL ? "משך הניסוי" : "Duration"}</Label>
                        <p className="font-medium">
                          {simulationData.length > 0 && typeof simulationData[simulationData.length - 1]?.time === 'number'
                            ? `${simulationData[simulationData.length - 1].time.toFixed(3)}s`
                            : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{isRTL ? "פרמטרי הניסוי" : "Experiment Parameters"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedRunParamState.error ? (
                        <p className="text-sm text-red-600">
                          {isRTL
                            ? "לא ניתן להציג את פרמטרי הניסוי עקב שגיאת פענוח נתונים."
                            : "Cannot display experiment parameters due to a JSON parsing error."}
                        </p>
                      ) : Object.keys(selectedRunParamState.parameters).length === 0 ? (
                        <p className="text-sm text-slate-500">
                          {isRTL ? "לא נשמרו פרמטרים לריצה זו." : "No parameters recorded for this run."}
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(selectedRunParamState.parameters).map(([key, value]) => (
                            <div key={key} className="p-3 bg-slate-50 rounded-lg">
                              <Label className="text-xs text-slate-500 uppercase">{key}</Label>
                              <p className="font-mono text-lg break-all">{formatDisplayValue(value, 3)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Data Tab */}
                <TabsContent value="data" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{isRTL ? "טבלת נתונים" : "Data Table"}</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => exportRunData('csv')} disabled={!simulationData.length} className="gap-2">
                          <Download className="w-4 h-4" />
                          CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {simulationData.length > 0 && Object.keys(simulationData[0]).map(key => (
                                <TableHead key={key} className="text-xs">{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {simulationData.map((row, index) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value, i) => (
                                  <TableCell key={i} className="text-xs">
                                    {formatDisplayValue(value, 4)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{isRTL ? "הגדרות גרף" : "Chart Configuration"}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>{isRTL ? "ציר X" : "X Axis"}</Label>
                        <Select value={chartConfig.xAxis} onValueChange={(value) => setChartConfig(prev => ({ ...prev, xAxis: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getChartAxisOptions().map(key => (
                              <SelectItem key={String(key)} value={String(key)}>
                                {isRTL && key.startsWith('theoretical_') ? `תיאורטי ${key.replace('theoretical_', '')}` : key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>{isRTL ? "ציר Y" : "Y Axis"}</Label>
                        <Select value={chartConfig.yAxis} onValueChange={(value) => setChartConfig(prev => ({ ...prev, yAxis: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getChartAxisOptions().map(key => (
                              <SelectItem key={String(key)} value={String(key)}>
                                {isRTL && key.startsWith('theoretical_') ? `תיאורטי ${key.replace('theoretical_', '')}` : key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>{isRTL ? "נוסחה פיזיקלית" : "Physics Formula"}</Label>
                        <Select
                          value={chartConfig.selectedFormula?.id || 'none'}
                          onValueChange={(value) => {
                            const formula = value && value !== 'none'
                              ? physicsFormulas[selectedRun.experiment_slug]?.find(f => f.id === value)
                              : null;
                            setChartConfig(prev => ({
                              ...prev,
                              selectedFormula: formula,
                              xAxis: formula?.axes?.[0] || 'time',
                              yAxis: formula?.axes?.[1] || 'position'
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isRTL ? "בחר נוסחה" : "Select Formula"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{isRTL ? "ללא" : "None"}</SelectItem>
                            {physicsFormulas[selectedRun.experiment_slug]?.map(formula => (
                              <SelectItem key={String(formula.id)} value={String(formula.id)}>
                                {isRTL ? formula.name_he : formula.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Checkbox
                            id="theoretical"
                            checked={chartConfig.showTheoretical}
                            onCheckedChange={(checked) => setChartConfig(prev => ({ ...prev, showTheoretical: Boolean(checked) }))}
                          />
                          <Label htmlFor="theoretical" className="text-sm">
                            {isRTL ? "הצג תיאורטי" : "Show Theoretical"}
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{isRTL ? "גרף אינטראקטיבי" : "Interactive Chart"}</CardTitle>
                      {chartConfig.selectedFormula && (
                        <p className="text-sm text-slate-600 font-mono">
                          {chartConfig.selectedFormula.formula}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey={chartConfig.xAxis}
                              label={{ value: chartConfig.xAxis, position: 'insideBottom', offset: -10 }}
                            />
                            <YAxis
                              label={{ value: chartConfig.yAxis, angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                typeof value === 'number' ? value.toFixed(4) : value,
                                name
                              ]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey={chartConfig.yAxis}
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name={isRTL ? "נתוני ניסוי" : "Experimental Data"}
                              isAnimationActive={false}
                            />
                            {chartConfig.showTheoretical && chartConfig.selectedFormula && chartData.some(d => Object.prototype.hasOwnProperty.call(d, 'theoretical_yAxis')) && (
                              <Line
                                type="monotone"
                                dataKey="theoretical_yAxis"
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name={isRTL ? "תיאורטי" : "Theoretical"}
                                isAnimationActive={false}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{isRTL ? "ניתוח סטטיסטי" : "Statistical Analysis"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {getAvailableDataKeys().map(key => {
                          const values = simulationData.map(d => d[key]).filter(v => typeof v === 'number');
                          if (values.length === 0) return null;
                          const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
                          const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);

                          return (
                            <div key={key} className="p-4 bg-slate-50 rounded-lg">
                              <h4 className="font-medium text-sm mb-2">{key}</h4>
                              <div className="space-y-1 text-xs">
                                <p><span className="text-slate-500">{isRTL ? "ממוצע:" : "Average:"}</span> {avg.toFixed(4)}</p>
                                <p><span className="text-slate-500">{isRTL ? "סטיית תקן:" : "Std Dev:"}</span> {std.toFixed(4)}</p>
                                <p><span className="text-slate-500">{isRTL ? "מינימום:" : "Min:"}</span> {Math.min(...values).toFixed(4)}</p>
                                <p><span className="text-slate-500">{isRTL ? "מקסימום:" : "Max:"}</span> {Math.max(...values).toFixed(4)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{isRTL ? "השוואת תיאורטי למעשי" : "Theoretical vs Experimental Comparison"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartConfig.selectedFormula && chartConfig.showTheoretical ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600">
                            {isRTL ? "השוואה לנוסחה: " : "Comparing to formula: "}
                            <span className="font-mono">{chartConfig.selectedFormula.formula}</span>
                          </p>

                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="theoretical_yAxis"
                                  label={{ value: isRTL ? 'תיאורטי' : 'Theoretical', position: 'insideBottom', offset: -10 }}
                                />
                                <YAxis
                                  dataKey={chartConfig.yAxis}
                                  label={{ value: isRTL ? 'מעשי' : 'Experimental', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip />
                                <Scatter
                                  dataKey={chartConfig.yAxis}
                                  fill="#3b82f6"
                                  name={isRTL ? "נתוני השוואה" : "Comparison Data"}
                                />
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-8">
                          {isRTL ? "בחר נוסחה פיזיקלית והפעל 'הצג תיאורטי' בטאב הגרפים כדי לראות השוואה" : "Select a physics formula and enable 'Show Theoretical' in the Charts tab to see comparison"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Delete Run Confirmation Dialog */}
      <AlertDialog
        open={Boolean(runPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingRun) setRunPendingDelete(null);
        }}
      >
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "אישור מחיקת ריצה" : "Confirm Run Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? "האם אתה בטוח שברצונך למחוק ריצה זו? לא ניתן לשחזר פעולה זו."
                : "Are you sure you want to delete this run? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingRun}>
              {isRTL ? "ביטול" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingRun}
              onClick={confirmDeleteRun}
            >
              {isRTL ? "מחק" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
