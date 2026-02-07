"use client";

import { useEffect, useMemo, useState } from "react";
import { useBuildStore } from "@/lib/store";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { getSampleAnalysisBundle, type AnalysisBundle } from "@/lib/api";
import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceArea,
} from "recharts";

type SectionOption = {
  id: string;
  label: string;
  description: string;
  group: "core" | "advanced";
};

const SECTION_OPTIONS: SectionOption[] = [
  { id: "summary", label: "Run Summary", description: "What data and models were used", group: "core" },
  { id: "metrics", label: "Model Metrics", description: "RMSE, MAE, and improvement", group: "core" },
  { id: "test-fit", label: "Test Fit", description: "Actual vs baseline vs multivariate", group: "core" },
  { id: "future-forecast", label: "Future Forecast", description: "Forecast horizon comparison", group: "core" },
  {
    id: "feature-importance",
    label: "Feature Importance",
    description: "Top model features",
    group: "core",
  },
  {
    id: "error-trend",
    label: "Error Trend",
    description: "Absolute error over the test window",
    group: "advanced",
  },
  {
    id: "driver-series",
    label: "Driver Signals",
    description: "Temperature and holiday pattern",
    group: "advanced",
  },
  { id: "forecast-table", label: "Forecast Table", description: "Raw forecast values", group: "advanced" },
];

const CORE_SECTIONS = SECTION_OPTIONS.filter((s) => s.group === "core").map((s) => s.id);
const ALL_SECTIONS = SECTION_OPTIONS.map((s) => s.id);

type LooseRecord = Record<string, string | number | null | undefined>;

function parseTimestamp(value: string) {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function formatShortDateFromTs(value: number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}-${month}-${year}`;
}

function formatLongDateFromTs(value: number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateString(value: string) {
  const ts = parseTimestamp(value);
  return ts === null ? value : formatShortDateFromTs(ts);
}

function formatAxisNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toFixed(0);
}

function computeDomain<T extends Record<string, unknown>>(
  data: T[],
  keys: Array<keyof T>,
  clampZero = false
): [number, number] {
  const values: number[] = [];
  for (const row of data) {
    for (const key of keys) {
      const raw = row[key];
      if (raw === null || raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n)) values.push(n);
    }
  }

  if (values.length === 0) return [0, 1];

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.05, 1);
    min -= pad;
    max += pad;
  } else {
    const pad = (max - min) * 0.15;
    min -= pad;
    max += pad;
  }

  if (clampZero && min > 0) {
    min = 0;
  }

  return [min, max];
}

function tooltipValue(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  const abs = Math.abs(n);
  const maximumFractionDigits = abs >= 100 ? 0 : 2;
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(n);
}

function formatDecimal(value: number, maxFractionDigits = 2) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: maxFractionDigits }).format(value);
}

function getDateString(row: LooseRecord): string | null {
  const candidate = row.week_ending ?? row.date ?? row.index;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

function getPrimaryNumericValue(row: LooseRecord): number | null {
  for (const [key, raw] of Object.entries(row)) {
    if (key === "week_ending" || key === "date" || key === "index") continue;
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function computeWindow<T extends { ts: number }>(
  rows: T[],
  zoomPercent: number,
  panPercent: number
) {
  if (rows.length === 0) {
    return {
      rows: [] as T[],
      startTs: null as number | null,
      endTs: null as number | null,
      startIndex: 0,
      endIndex: 0,
    };
  }

  const safeZoom = clamp(zoomPercent, 5, 100);
  const windowSize = clamp(Math.round((rows.length * safeZoom) / 100), 2, rows.length);
  const maxStart = Math.max(0, rows.length - windowSize);
  const safePan = clamp(panPercent, 0, 100);
  const startIndex = Math.round((safePan / 100) * maxStart);
  const endIndex = startIndex + windowSize - 1;
  const visibleRows = rows.slice(startIndex, endIndex + 1);

  return {
    rows: visibleRows,
    startTs: visibleRows[0]?.ts ?? null,
    endTs: visibleRows[visibleRows.length - 1]?.ts ?? null,
    startIndex,
    endIndex,
  };
}

export default function Step4Analysis() {
  const { completeStep, nextStep, prevStep } = useBuildStore();

  const [analysis, setAnalysis] = useState<AnalysisBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>(CORE_SECTIONS);
  const [testZoom, setTestZoom] = useState(35);
  const [testPan, setTestPan] = useState(100);
  const [forecastZoom, setForecastZoom] = useState(35);
  const [forecastPan, setForecastPan] = useState(100);
  const [driverTempZoom, setDriverTempZoom] = useState(45);
  const [driverTempPan, setDriverTempPan] = useState(100);
  const [driverHolidayZoom, setDriverHolidayZoom] = useState(45);
  const [driverHolidayPan, setDriverHolidayPan] = useState(100);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const bundle = await getSampleAnalysisBundle();
        if (!mounted) return;
        setAnalysis(bundle);
      } catch (err: unknown) {
        if (!mounted) return;
        const detail =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setLoadError(detail || "Could not load analysis bundle from backend.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const testFitData = useMemo(
    () =>
      (analysis?.datasets.test_predictions || [])
        .map((r) => ({
          ts: parseTimestamp(r.week_ending),
          week_ending: r.week_ending,
          actual: Number(r.actual),
          baseline: Number(r.baseline),
          multivariate: Number(r.multivariate),
        }))
        .filter((r): r is { ts: number; week_ending: string; actual: number; baseline: number; multivariate: number } => r.ts !== null)
        .sort((a, b) => a.ts - b.ts),
    [analysis]
  );

  const historicalTargetData = useMemo(
    () =>
      (analysis?.datasets.target_series || [])
        .map((row) => {
          const asRecord = row as LooseRecord;
          const dateString = getDateString(asRecord);
          if (!dateString) return null;
          const ts = parseTimestamp(dateString);
          const actual = getPrimaryNumericValue(asRecord);
          if (ts === null || actual === null) return null;
          return {
            ts,
            week_ending: dateString,
            actual,
          };
        })
        .filter((r): r is { ts: number; week_ending: string; actual: number } => r !== null)
        .sort((a, b) => a.ts - b.ts),
    [analysis]
  );

  const testFitCombinedData = useMemo(() => {
    const predMap = new Map(
      testFitData.map((r) => [
        r.ts,
        {
          baseline: r.baseline,
          multivariate: r.multivariate,
          actual_test: r.actual,
        },
      ])
    );

    return historicalTargetData.map((r) => {
      const pred = predMap.get(r.ts);
      return {
        ts: r.ts,
        week_ending: r.week_ending,
        actual: r.actual,
        baseline: pred ? pred.baseline : null,
        multivariate: pred ? pred.multivariate : null,
        actual_test: pred ? pred.actual_test : null,
      };
    });
  }, [historicalTargetData, testFitData]);

  const forecastData = useMemo(
    () =>
      (analysis?.datasets.forecast || [])
        .map((r) => ({
          ts: parseTimestamp(r.week_ending),
          week_ending: r.week_ending,
          baseline_forecast: Number(r.baseline_forecast),
          multivariate_forecast: Number(r.multivariate_forecast),
        }))
        .filter(
          (r): r is { ts: number; week_ending: string; baseline_forecast: number; multivariate_forecast: number } =>
            r.ts !== null
        )
        .sort((a, b) => a.ts - b.ts),
    [analysis]
  );

  const forecastCombinedData = useMemo(() => {
    const rows = new Map<
      number,
      {
        ts: number;
        week_ending: string;
        actual: number | null;
        baseline_forecast: number | null;
        multivariate_forecast: number | null;
      }
    >();

    for (const row of historicalTargetData) {
      rows.set(row.ts, {
        ts: row.ts,
        week_ending: row.week_ending,
        actual: row.actual,
        baseline_forecast: null,
        multivariate_forecast: null,
      });
    }

    for (const row of forecastData) {
      const existing = rows.get(row.ts);
      if (existing) {
        existing.baseline_forecast = row.baseline_forecast;
        existing.multivariate_forecast = row.multivariate_forecast;
      } else {
        rows.set(row.ts, {
          ts: row.ts,
          week_ending: row.week_ending,
          actual: null,
          baseline_forecast: row.baseline_forecast,
          multivariate_forecast: row.multivariate_forecast,
        });
      }
    }

    return Array.from(rows.values()).sort((a, b) => a.ts - b.ts);
  }, [historicalTargetData, forecastData]);

  const featureImportanceData = useMemo(
    () =>
      (analysis?.datasets.feature_importance || [])
        .map((r) => ({ feature: r.feature, importance: Number(r.importance) }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10),
    [analysis]
  );

  const errorTrendData = useMemo(
    () =>
      testFitData.map((r) => ({
        ts: r.ts,
        week_ending: r.week_ending,
        baseline_error: Math.abs(r.actual - r.baseline),
        multivariate_error: Math.abs(r.actual - r.multivariate),
      })),
    [testFitData]
  );

  const driverData = useMemo(() => {
    const holidayMap = new Map<number, number>();
    for (const row of analysis?.datasets.holiday_weekly || []) {
      const asRecord = row as LooseRecord;
      const dateString = getDateString(asRecord);
      if (!dateString) continue;
      const ts = parseTimestamp(dateString);
      if (ts === null) continue;
      const count = Number(asRecord.holiday_count);
      holidayMap.set(ts, Number.isFinite(count) ? count : 0);
    }

    return (analysis?.datasets.temp_weekly || [])
      .map((r) => ({
        ts: parseTimestamp(r.date),
        week_ending: r.date,
        temp_mean: Number(r.temp_mean),
        holiday_count: 0,
      }))
      .filter((r): r is { ts: number; week_ending: string; temp_mean: number; holiday_count: number } => r.ts !== null)
      .map((r) => ({
        ...r,
        holiday_count: holidayMap.get(r.ts) || 0,
      }))
      .sort((a, b) => a.ts - b.ts);
  }, [analysis]);

  const testFitWindow = useMemo(
    () => computeWindow(testFitCombinedData, testZoom, testPan),
    [testFitCombinedData, testZoom, testPan]
  );
  const forecastWindow = useMemo(
    () => computeWindow(forecastCombinedData, forecastZoom, forecastPan),
    [forecastCombinedData, forecastZoom, forecastPan]
  );
  const driverTempWindow = useMemo(
    () => computeWindow(driverData, driverTempZoom, driverTempPan),
    [driverData, driverTempZoom, driverTempPan]
  );
  const driverHolidayWindow = useMemo(
    () => computeWindow(driverData, driverHolidayZoom, driverHolidayPan),
    [driverData, driverHolidayZoom, driverHolidayPan]
  );

  const testFitDomain = useMemo(
    () => computeDomain(testFitWindow.rows, ["actual", "baseline", "multivariate"]),
    [testFitWindow.rows]
  );
  const forecastDomain = useMemo(
    () => computeDomain(forecastWindow.rows, ["actual", "baseline_forecast", "multivariate_forecast"]),
    [forecastWindow.rows]
  );
  const errorDomain = useMemo(
    () => computeDomain(errorTrendData, ["baseline_error", "multivariate_error"], true),
    [errorTrendData]
  );
  const tempDomain = useMemo(() => computeDomain(driverTempWindow.rows, ["temp_mean"]), [driverTempWindow.rows]);
  const holidayDomain = useMemo(
    () => computeDomain(driverHolidayWindow.rows, ["holiday_count"], true),
    [driverHolidayWindow.rows]
  );
  const testWindowStartTs = testFitData.length > 0 ? testFitData[0].ts : null;
  const testWindowEndTs = testFitData.length > 0 ? testFitData[testFitData.length - 1].ts : null;
  const forecastWindowStartTs = forecastData.length > 0 ? forecastData[0].ts : null;
  const forecastWindowEndTs = forecastData.length > 0 ? forecastData[forecastData.length - 1].ts : null;

  const forecastTableRows = useMemo(() => forecastData.slice(0, 8), [forecastData]);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    completeStep(4);
    nextStep();
  };

  const fmt = new Intl.NumberFormat("en-GB");
  const pct = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
  const targetLabel = analysis?.manifest.data_summary.target_name || "Target";
  const evaluationSectionIds = ["summary", "metrics", "test-fit", "error-trend", "feature-importance"];
  const predictionSectionIds = ["future-forecast", "driver-series", "forecast-table"];
  const showEvaluation = selectedSections.some((id) => evaluationSectionIds.includes(id));
  const showPrediction = selectedSections.some((id) => predictionSectionIds.includes(id));

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Analysis View</h3>
        <p className="text-sm text-slate-400">
          Pick what to show below. Start with Core sections for a simple view, then add Advanced sections if needed.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSelectedSections(CORE_SECTIONS)}>
            Core only
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSelectedSections(ALL_SECTIONS)}>
            Show all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedSections([])}>
            Clear
          </Button>
          <Badge variant={loadError ? "warning" : "success"}>
            {loadError ? "Partial data" : "Data loaded"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECTION_OPTIONS.map((section) => {
            const active = selectedSections.includes(section.id);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`text-left rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                  active
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{section.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{section.description}</p>
                  </div>
                  <div className="shrink-0">
                    {active ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-black text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-slate-400 text-xs">
                        {section.group === "core" ? "C" : "A"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-slate-300 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
          Loading analysis outputs...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-2xl border border-amber-800 bg-amber-950/20 p-6 text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Analysis bundle issue</p>
            <p className="text-sm opacity-90">{loadError}</p>
          </div>
        </div>
      )}

      {!loading && analysis && (
        <div className="space-y-6">
          {showEvaluation && (
            <div className="rounded-2xl border border-sky-800/60 bg-sky-950/20 px-4 py-3">
              <p className="text-sm font-semibold text-sky-300">Phase 1: Evaluation and Metrics (Train/Test)</p>
              <p className="text-xs text-sky-200/80 mt-1">
                Use this section to judge model quality on the held-out 20 percent test window.
              </p>
            </div>
          )}

          {selectedSections.includes("summary") && (
            <Card>
              <CardHeader>
                <CardTitle>Run Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <InfoCard label="Target" value={analysis.manifest.data_summary.target_name} />
                  <InfoCard
                    label="Date range"
                    value={`${analysis.manifest.data_summary.start} to ${analysis.manifest.data_summary.end}`}
                  />
                  <InfoCard
                    label="Rows and freq"
                    value={`${analysis.manifest.data_summary.rows} rows, ${analysis.manifest.data_summary.freq}`}
                  />
                  <InfoCard
                    label="Models"
                    value={`${String(analysis.manifest.settings.baseline_model)} + ${String(
                      analysis.manifest.settings.multi_model
                    )}`}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("metrics") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Baseline RMSE" value={fmt.format(analysis.manifest.metrics.baseline_rmse)} tone="neutral" />
              <KpiCard
                title="Multivariate RMSE"
                value={fmt.format(analysis.manifest.metrics.multivariate_rmse)}
                tone="success"
              />
              <KpiCard title="Improvement" value={`${pct.format(analysis.manifest.metrics.improvement_pct)}%`} tone="success" />
            </div>
          )}

          {selectedSections.includes("test-fit") && (
            <Card>
              <CardHeader>
                <CardTitle>Test Window Fit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-1">
                  X-axis: full timeline from `artifacts/target_series.csv`, with the final test region highlighted.
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Y-axis: {targetLabel} count. Baseline and multivariate lines are only shown in the test window.
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Use the View Window sliders to zoom and pan across time.
                </p>
                {testFitCombinedData.length === 0 ? (
                  <EmptyState text="No test_predictions data found." />
                ) : (
                  <div className="space-y-3">
                    <ChartWrap>
                      <LineChart data={testFitWindow.rows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="ts"
                          type="number"
                          scale="time"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(v) => formatShortDateFromTs(Number(v))}
                          minTickGap={28}
                          angle={-25}
                          textAnchor="end"
                          height={56}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis domain={testFitDomain} tickFormatter={formatAxisNumber} tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(label) => formatLongDateFromTs(Number(label))}
                          formatter={tooltipValue}
                        />
                        <Legend />
                        {testWindowStartTs !== null && testWindowEndTs !== null && (
                          <ReferenceArea
                            x1={testWindowStartTs}
                            x2={testWindowEndTs}
                            fill="#14532d"
                            fillOpacity={0.22}
                            ifOverflow="extendDomain"
                          />
                        )}
                        <Line type="monotone" dataKey="actual" stroke="#cbd5e1" dot={false} strokeWidth={2} />
                        <Line
                          type="monotone"
                          dataKey="actual_test"
                          stroke="#22c55e"
                          dot={false}
                          strokeDasharray="4 3"
                          name="actual (test)"
                        />
                        <Line type="monotone" dataKey="baseline" stroke="#3b82f6" dot={false} />
                        <Line type="monotone" dataKey="multivariate" stroke="#14b8a6" dot={false} />
                      </LineChart>
                    </ChartWrap>
                    <TimelineControls
                      title="View Window"
                      zoom={testZoom}
                      pan={testPan}
                      onZoom={setTestZoom}
                      onPan={setTestPan}
                      fromTs={testFitWindow.startTs}
                      toTs={testFitWindow.endTs}
                      disablePan={testFitWindow.rows.length === testFitCombinedData.length}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("error-trend") && (
            <Card>
              <CardHeader>
                <CardTitle>Absolute Error Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">
                  Y-axis: absolute error in {targetLabel} units, computed from test predictions.
                </p>
                {errorTrendData.length === 0 ? (
                  <EmptyState text="No test data available for error trend." />
                ) : (
                  <ChartWrap>
                    <LineChart data={errorTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        scale="time"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(v) => formatShortDateFromTs(Number(v))}
                        minTickGap={28}
                        angle={-25}
                        textAnchor="end"
                        height={56}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis domain={errorDomain} tickFormatter={formatAxisNumber} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(label) => formatLongDateFromTs(Number(label))}
                        formatter={tooltipValue}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="baseline_error" stroke="#3b82f6" dot={false} />
                      <Line type="monotone" dataKey="multivariate_error" stroke="#14b8a6" dot={false} />
                    </LineChart>
                  </ChartWrap>
                )}
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("feature-importance") && (
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">
                  Y-axis lists feature names. X-axis is relative model importance from
                  `artifacts/feature_importance.csv`.
                </p>
                {featureImportanceData.length === 0 ? (
                  <EmptyState text="No feature importance data found." />
                ) : (
                  <ChartWrap height={340}>
                    <BarChart data={featureImportanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tickFormatter={(v) => formatDecimal(Number(v), 2)} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="feature" width={160} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={tooltipValue} />
                      <Bar dataKey="importance" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartWrap>
                )}
              </CardContent>
            </Card>
          )}

          {showPrediction && (
            <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-300">Phase 2: Prediction and Forecast</p>
              <p className="text-xs text-emerald-200/80 mt-1">
                Use this section to review forward-looking forecasts generated after model training.
              </p>
            </div>
          )}

          {selectedSections.includes("future-forecast") && (
            <Card>
              <CardHeader>
                <CardTitle>Future Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-1">
                  X-axis: historical timeline from `artifacts/target_series.csv` plus future dates from
                  `forecasts/forecast.csv`.
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Y-axis: {targetLabel} count. Historical actuals are shown up to now, then forecast lines continue
                  forward.
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Use the View Window sliders to zoom and pan, then inspect the right-hand forecast region in detail.
                </p>
                {forecastCombinedData.length === 0 ? (
                  <EmptyState text="No forecast data found." />
                ) : (
                  <div className="space-y-3">
                    <ChartWrap>
                      <LineChart data={forecastWindow.rows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="ts"
                          type="number"
                          scale="time"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(v) => formatShortDateFromTs(Number(v))}
                          minTickGap={28}
                          angle={-25}
                          textAnchor="end"
                          height={56}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis domain={forecastDomain} tickFormatter={formatAxisNumber} tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(label) => formatLongDateFromTs(Number(label))}
                          formatter={tooltipValue}
                        />
                        <Legend />
                        {forecastWindowStartTs !== null && forecastWindowEndTs !== null && (
                          <ReferenceArea
                            x1={forecastWindowStartTs}
                            x2={forecastWindowEndTs}
                            fill="#022c22"
                            fillOpacity={0.22}
                            ifOverflow="extendDomain"
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="actual"
                          name="historical actual"
                          stroke="#cbd5e1"
                          dot={false}
                          strokeWidth={2}
                        />
                        <Line type="monotone" dataKey="baseline_forecast" name="baseline" stroke="#3b82f6" dot={false} />
                        <Line
                          type="monotone"
                          dataKey="multivariate_forecast"
                          name="multivariate"
                          stroke="#14b8a6"
                          dot={false}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ChartWrap>
                    <TimelineControls
                      title="View Window"
                      zoom={forecastZoom}
                      pan={forecastPan}
                      onZoom={setForecastZoom}
                      onPan={setForecastPan}
                      fromTs={forecastWindow.startTs}
                      toTs={forecastWindow.endTs}
                      disablePan={forecastWindow.rows.length === forecastCombinedData.length}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedSections.includes("driver-series") && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Signal: Temperature</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 mb-3">
                    Y-axis: weekly mean temperature from `artifacts/temp_weekly.csv`.
                  </p>
                  {driverData.length === 0 ? (
                    <EmptyState text="No temperature driver data found." />
                  ) : (
                    <div className="space-y-3">
                      <ChartWrap>
                        <LineChart data={driverTempWindow.rows}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="ts"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(v) => formatShortDateFromTs(Number(v))}
                            minTickGap={28}
                            angle={-25}
                            textAnchor="end"
                            height={56}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis
                            domain={tempDomain}
                            tickFormatter={(v) => formatDecimal(Number(v), 1)}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            labelFormatter={(label) => formatLongDateFromTs(Number(label))}
                            formatter={tooltipValue}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="temp_mean" stroke="#22d3ee" dot={false} />
                        </LineChart>
                      </ChartWrap>
                      <TimelineControls
                        title="View Window"
                        zoom={driverTempZoom}
                        pan={driverTempPan}
                        onZoom={setDriverTempZoom}
                        onPan={setDriverTempPan}
                        fromTs={driverTempWindow.startTs}
                        toTs={driverTempWindow.endTs}
                        disablePan={driverTempWindow.rows.length === driverData.length}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Driver Signal: Holidays</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 mb-3">
                    Y-axis: holiday count from `artifacts/holiday_weekly.csv`.
                  </p>
                  {driverData.length === 0 ? (
                    <EmptyState text="No holiday driver data found." />
                  ) : (
                    <div className="space-y-3">
                      <ChartWrap>
                        <BarChart data={driverHolidayWindow.rows}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="ts"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(v) => formatShortDateFromTs(Number(v))}
                            minTickGap={28}
                            angle={-25}
                            textAnchor="end"
                            height={56}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis domain={holidayDomain} tickFormatter={formatAxisNumber} tick={{ fontSize: 11 }} />
                          <Tooltip
                            labelFormatter={(label) => formatLongDateFromTs(Number(label))}
                            formatter={tooltipValue}
                          />
                          <Legend />
                          <Bar dataKey="holiday_count" name="holiday count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ChartWrap>
                      <TimelineControls
                        title="View Window"
                        zoom={driverHolidayZoom}
                        pan={driverHolidayPan}
                        onZoom={setDriverHolidayZoom}
                        onPan={setDriverHolidayPan}
                        fromTs={driverHolidayWindow.startTs}
                        toTs={driverHolidayWindow.endTs}
                        disablePan={driverHolidayWindow.rows.length === driverData.length}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedSections.includes("forecast-table") && (
            <Card>
              <CardHeader>
                <CardTitle>Forecast Table</CardTitle>
              </CardHeader>
              <CardContent>
                {forecastTableRows.length === 0 ? (
                  <EmptyState text="No rows to display." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-slate-700">
                          <th className="py-2">Week Ending</th>
                          <th className="py-2">Baseline</th>
                          <th className="py-2">Multivariate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecastTableRows.map((row) => (
                          <tr key={row.week_ending} className="border-b border-slate-800/70">
                            <td className="py-2 text-slate-300">{formatDateString(row.week_ending)}</td>
                            <td className="py-2 text-slate-300">{fmt.format(row.baseline_forecast)}</td>
                            <td className="py-2 text-slate-200">{fmt.format(row.multivariate_forecast)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedSections.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p>Select at least one section to populate the analysis view.</p>
            </div>
          )}
        </div>
      )}

      {!loading && !analysis && !loadError && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-slate-400">
          <EmptyState text="No analysis data available." />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={prevStep}>
          {"<- Back"}
        </Button>
        <Button onClick={handleContinue} disabled={selectedSections.length === 0} size="lg">
          {"Continue to Showcase ->"}
        </Button>
      </div>
    </div>
  );
}

function ChartWrap({ children, height = 320 }: { children: React.ReactNode; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children as React.ReactElement}
    </ResponsiveContainer>
  );
}

function TimelineControls({
  title,
  zoom,
  pan,
  onZoom,
  onPan,
  fromTs,
  toTs,
  disablePan,
}: {
  title: string;
  zoom: number;
  pan: number;
  onZoom: (value: number) => void;
  onPan: (value: number) => void;
  fromTs: number | null;
  toTs: number | null;
  disablePan: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-300">{title}</p>
        <p className="text-xs text-slate-400">
          {fromTs !== null && toTs !== null
            ? `${formatShortDateFromTs(fromTs)} to ${formatShortDateFromTs(toTs)}`
            : "No range"}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Zoom</span>
          <span>{zoom}% visible</span>
        </div>
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          className="w-full h-2 rounded-lg bg-slate-700 accent-teal-500 cursor-pointer"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Pan</span>
          <span>{pan}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pan}
          onChange={(e) => onPan(Number(e.target.value))}
          disabled={disablePan}
          className="w-full h-2 rounded-lg bg-slate-700 accent-teal-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "neutral" | "success";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "success"
          ? "border-emerald-800 bg-emerald-900/20"
          : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
      <div className="mt-2 text-xs">
        {tone === "success" ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Improved over baseline
          </span>
        ) : (
          <span className="text-slate-500">Reference metric</span>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-200 mt-1">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
