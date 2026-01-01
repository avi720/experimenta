
import React, { useState, useEffect } from "react";
import { ExperimentRun } from "@/entities/ExperimentRun";
import { ExperimentTemplate } from "@/entities/ExperimentTemplate";
import { AppSettings } from "@/entities/AppSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3, Download, Eye, Trash2, Filter, RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';
import { motion } from "framer-motion";
import { format } from "date-fns";

// נוסחאות פיזיקליות מוגדרות מראש
const physicsFormulas = {
  'free-fall': [
    {
      id: 'position_vs_time',
      name_he: 'מיקום כתלות בזמן',
      name_en: 'Position vs Time',
      formula: 'h = h₀ + v₀t - ½gt²',
      axes: ['time', 'position', 'theoretical_position'],
      calculate: (data, params) => data.map(point => ({
        ...point,
        theoretical_position: params.h0 + (params.v0 || 0) * point.time - 0.5 * params.g * Math.pow(point.time, 2)
      }))
    },
    {
      id: 'velocity_vs_time',
      name_he: 'מהירות כתלות בזמן',
      name_en: 'Velocity vs Time',
      formula: 'v = v₀ - gt',
      axes: ['time', 'velocity', 'theoretical_velocity'],
      calculate: (data, params) => data.map(point => ({
        ...point,
        theoretical_velocity: (params.v0 || 0) - params.g * point.time
      }))
    },
    {
      id: 'energy_conservation',
      name_he: 'שימור אנרגיה',
      name_en: 'Energy Conservation',
      formula: 'E = KE + PE = ½mv² + mgh',
      axes: ['time', 'energy_kinetic', 'energy_potential', 'total_energy', 'theoretical_energy'],
      calculate: (data, params) => data.map(point => ({
        ...point,
        total_energy: point.energy_kinetic + point.energy_potential,
        theoretical_energy: params.m * params.g * params.h0
      }))
    }
  ],
  'sho': [
    {
      id: 'sho_position',
      name_he: 'מתנד הרמוני - מיקום',
      name_en: 'SHO Position',
      formula: 'x = A cos(ωt + φ)',
      axes: ['time', 'position', 'theoretical_position'],
      calculate: (data, params) => {
        const omega = Math.sqrt(params.k / params.m);
        return data.map(point => ({
          ...point,
          theoretical_position: params.x0 * Math.cos(omega * point.time)
        }));
      }
    }
  ]
};

export default function Results() {
  const [runs, setRuns] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);
  const [simulationData, setSimulationData] = useState([]);
  const [currentTab, setCurrentTab] = useState("overview");

  // Chart configuration
  const [chartConfig, setChartConfig] = useState({
    xAxis: 'time',
    yAxis: 'position',
    showTheoretical: false,
    selectedFormula: null,
    compareRuns: []
  });
  // Filters
  const [filters, setFilters] = useState({
    experiment: 'all',
    dateRange: 'all'
  });

  const isRTL = settings?.locale_default === 'he';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [runsList, experimentsList, settingsList] = await Promise.all([
        ExperimentRun.list('-created_date'),
        ExperimentTemplate.list(),
        AppSettings.list()
      ]);

      setRuns(runsList);
      setExperiments(experimentsList);
      setSettings(settingsList[0] || { locale_default: 'he' });
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const deleteRun = async (runId) => {
    if (!window.confirm(isRTL ? "האם אתה בטוח שברצונך למחוק ריצה זו?" : "Are you sure you want to delete this run?")) {
      return;
    }
    try {
      await ExperimentRun.delete(runId);
      if (selectedRun?.id === runId) {
        setSelectedRun(null);
        setSimulationData([]);
      }
      await loadData(); // Reload the list of runs
    } catch (error) {
      console.error("Error deleting run:", error);
      alert(isRTL ? "שגיאה במחיקת הריצה." : "Error deleting run.");
    }
  };

  const loadRunData = async (run) => {
    setSelectedRun(run);

    // Generate sample data based on parameters
    // In a real app, this would load from the stored results_url
    const parameters = JSON.parse(run.parameters_json || '{}');
    const sampleData = generateSampleData(run.experiment_slug, parameters, run.samples_count);
    setSimulationData(sampleData);

    // Set default chart config for experiment type
    setChartConfig(prev => ({
      ...prev,
      selectedFormula: physicsFormulas[run.experiment_slug]?.[0] || null,
      xAxis: 'time',
      yAxis: physicsFormulas[run.experiment_slug]?.[0]?.axes[1] || 'position'
    }));
  };

  const generateSampleData = (experimentSlug, parameters, count) => {
    const data = [];
    const dt = 0.05; // Matched with LabWorkspace dt

    for (let i = 0; i < count; i++) {
      const t = i * dt;
      let point = { time: t };

      if (experimentSlug === 'free-fall') {
        const h0 = parameters.h0 || 50;
        const g = parameters.g || 9.81;
        const m = parameters.m || 1;

        point.position = Math.max(0, h0 - 0.5 * g * t * t);
        point.velocity = -g * t;
        point.energy_kinetic = 0.5 * m * point.velocity * point.velocity;
        point.energy_potential = m * g * point.position;

        if (point.position <= 0) break;
      } else if (experimentSlug === 'sho') {
        const k = parameters.k || 10;
        const m = parameters.m || 1;
        const x0 = parameters.x0 || 1;
        const omega = Math.sqrt(k / m);

        point.position = x0 * Math.cos(omega * t);
        point.velocity = -x0 * omega * Math.sin(omega * t);
        point.energy_total = 0.5 * k * x0 * x0;
      }

      data.push(point);
    }

    return data;
  };

  const getAvailableDataKeys = () => {
    if (!simulationData.length) return [];
    return Object.keys(simulationData[0]).filter(key =>
      key !== 'time' && typeof simulationData[0][key] === 'number'
    );
  };

  const getChartAxisOptions = () => {
    if (chartConfig.selectedFormula?.axes) {
      // Filter theoretical axes to only include those present in the actual data's base keys
      return chartConfig.selectedFormula.axes.filter(key => {
        const baseKey = key.replace('theoretical_', '');
        return simulationData.length > 0 && simulationData[0].hasOwnProperty(baseKey);
      });
    }
    return getAvailableDataKeys().concat(['time']);
  };

  const getChartData = () => {
    if (!simulationData.length) return [];

    let data = [...simulationData];

    // Apply theoretical formula if selected
    if (chartConfig.showTheoretical && chartConfig.selectedFormula && selectedRun) {
      const parameters = JSON.parse(selectedRun.parameters_json || '{}');
      data = chartConfig.selectedFormula.calculate(data, parameters);

      // Add a 'theoretical_yAxis' key for the chart
      const yAxisKey = chartConfig.yAxis;
      if (data.length > 0 && data[0].hasOwnProperty(`theoretical_${yAxisKey}`)) {
        data = data.map(d => ({ ...d, theoretical_yAxis: d[`theoretical_${yAxisKey}`] }));
      }
    }

    return data;
  };

  const exportRunData = (format) => {
    if (!selectedRun || !simulationData.length) return;

    if (format === 'csv') {
      const headers = Object.keys(simulationData[0]).join(',');
      const rows = simulationData.map(row => Object.values(row).join(',')).join('\n');
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

  const deleteDataRow = (index) => {
    setSimulationData(currentData => currentData.filter((_, i) => i !== index));
  };

  const filteredRuns = runs.filter(run => {
    if (filters.experiment !== 'all' && run.experiment_slug !== filters.experiment) return false;
    // Add date filtering logic here if needed
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRTL ? "רענן" : "Refresh"}
          </Button>
        </div>
      </div>

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
                {[...new Set(runs.map(run => run.experiment_slug))].map(slug => (
                  <SelectItem key={slug} value={slug}>{slug}</SelectItem>
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
            {filteredRuns.length === 0 ? (
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
                        {format(new Date(run.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {run.samples_count} {isRTL ? "נקודות" : "samples"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="ghost"
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
                        className="text-red-500 hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRun(run.id);
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
                      <p className="font-medium">{format(new Date(selectedRun.created_date), 'dd/MM/yyyy HH:mm:ss')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">{isRTL ? "מספר דגימות" : "Samples Count"}</Label>
                      <p className="font-medium">{selectedRun.samples_count}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">{isRTL ? "משך הניסוי" : "Duration"}</Label>
                      <p className="font-medium">{simulationData.length > 0 ? `${simulationData[simulationData.length - 1]?.time?.toFixed(3)}s` : 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? "פרמטרי הניסוי" : "Experiment Parameters"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(JSON.parse(selectedRun.parameters_json || '{}')).map(([key, value]) => (
                        <div key={key} className="p-3 bg-slate-50 rounded-lg">
                          <Label className="text-xs text-slate-500 uppercase">{key}</Label>
                          <p className="font-mono text-lg">{typeof value === 'number' ? value.toFixed(3) : value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Data Tab */}
              <TabsContent value="data" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{isRTL ? "טבלת נתונים" : "Data Table"}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportRunData('csv')}>
                        <Download className="w-4 h-4 mr-2" />
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
                            <TableHead className="text-xs">{isRTL ? "פעולות" : "Actions"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulationData.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, i) => (
                                <TableCell key={i} className="text-xs">
                                  {typeof value === 'number' ? value.toFixed(4) : value}
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => deleteDataRow(index)}>
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </TableCell>
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
                            <SelectItem key={key} value={key}>{isRTL && key.startsWith('theoretical_') ? `תיאורטי ${key.replace('theoretical_', '')}` : key}</SelectItem>
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
                            <SelectItem key={key} value={key}>{isRTL && key.startsWith('theoretical_') ? `תיאורטי ${key.replace('theoretical_', '')}` : key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{isRTL ? "נוסחה פיזיקלית" : "Physics Formula"}</Label>
                      <Select
                        value={chartConfig.selectedFormula?.id || ''}
                        onValueChange={(value) => {
                          const formula = value ? physicsFormulas[selectedRun.experiment_slug]?.find(f => f.id === value) : null;
                          setChartConfig(prev => ({
                            ...prev,
                            selectedFormula: formula,
                            // Update axes to defaults for the formula if one is selected
                            xAxis: formula?.axes?.[0] || 'time',
                            yAxis: formula?.axes?.[1] || 'position'
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isRTL ? "בחר נוסחה" : "Select Formula"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>{isRTL ? "ללא" : "None"}</SelectItem>
                          {physicsFormulas[selectedRun.experiment_slug]?.map(formula => (
                            <SelectItem key={formula.id} value={formula.id}>
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
                          onCheckedChange={(checked) => setChartConfig(prev => ({ ...prev, showTheoretical: checked }))}
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
                        <LineChart data={getChartData()}>
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
                          {chartConfig.showTheoretical && chartConfig.selectedFormula && getChartData().some(d => d.hasOwnProperty('theoretical_yAxis')) && (
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
                        if (values.length === 0) return null; // Skip if no numeric values
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
                            <ScatterChart data={getChartData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="theoretical_yAxis" // Use the generated theoretical_yAxis
                                label={{ value: isRTL ? 'תיאורטי' : 'Theoretical', position: 'insideBottom', offset: -10 }}
                              />
                              <YAxis
                                dataKey={chartConfig.yAxis} // Use the actual experimental yAxis
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
          )}
        </div>
      </div>
    </div>
  );
}
