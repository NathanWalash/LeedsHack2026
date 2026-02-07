"use client";

import { useState } from "react";
import { useBuildStore } from "@/lib/store";
import { BubbleSelect, Input, Button } from "@/components/ui";
import { ForecastChart } from "@/components/viz/ForecastChart";
import {
  BarChart3,
  TrendingUp,
  Table,
  FileText,
  X,
  Plus,
} from "lucide-react";

const WIDGET_OPTIONS = [
  {
    id: "forecast-chart",
    label: "Forecast Chart",
    icon: "📈",
    description: "Main prediction line chart",
  },
  {
    id: "comparison",
    label: "Model Comparison",
    icon: "⚖️",
    description: "Baseline vs multivariate",
  },
  {
    id: "drivers-bar",
    label: "Driver Importance",
    icon: "📊",
    description: "Bar chart of feature importance",
  },
  {
    id: "summary-stats",
    label: "Summary Stats",
    icon: "📋",
    description: "Key numbers & metrics",
  },
  {
    id: "data-table",
    label: "Data Table",
    icon: "🗃️",
    description: "Raw predictions table",
  },
  {
    id: "narrative",
    label: "Narrative Block",
    icon: "✍️",
    description: "Custom text & commentary",
  },
];

export default function Step4Outputs() {
  const {
    widgets,
    addWidget,
    removeWidget,
    forecastResults,
    completeStep,
    nextStep,
    prevStep,
  } = useBuildStore();

  const [pendingWidget, setPendingWidget] = useState<string>("");
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetCaption, setWidgetCaption] = useState("");

  const handleAddWidget = () => {
    if (!pendingWidget) return;
    const opt = WIDGET_OPTIONS.find((w) => w.id === pendingWidget);
    addWidget({
      type: pendingWidget,
      title: widgetTitle || opt?.label || pendingWidget,
      caption: widgetCaption,
    });
    setPendingWidget("");
    setWidgetTitle("");
    setWidgetCaption("");
  };

  const handleContinue = () => {
    completeStep(4);
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Widget Picker */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white">
          Add Widgets to Your Report
        </h3>
        <p className="text-sm text-slate-400">
          Pick visualisations and content blocks to compose your report.
        </p>

        <BubbleSelect
          label="Widget Type"
          options={WIDGET_OPTIONS}
          selected={pendingWidget}
          onSelect={setPendingWidget}
        />

        {pendingWidget && (
          <div className="space-y-3 pt-2">
            <Input
              label="Widget Title"
              placeholder="e.g. Sales Forecast 2026"
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
            />
            <Input
              label="Caption (optional)"
              placeholder="Short description or insight"
              value={widgetCaption}
              onChange={(e) => setWidgetCaption(e.target.value)}
            />
            <Button onClick={handleAddWidget} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Widget
            </Button>
          </div>
        )}
      </div>

      {/* Report Canvas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Report Canvas
        </h3>

        {widgets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p>No widgets yet. Add some above to build your report.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {widgets.map((w, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {WIDGET_OPTIONS.find((o) => o.id === w.type)?.icon || "📊"}
                    </span>
                    <span className="font-medium text-white">{w.title}</span>
                    <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                      {w.type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeWidget(i)}
                    className="text-slate-500 hover:text-red-400 transition p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {w.caption && (
                  <p className="text-sm text-slate-400">{w.caption}</p>
                )}

                {/* Live preview for forecast chart */}
                {w.type === "forecast-chart" && forecastResults && (
                  <div className="mt-3">
                    <ForecastChart results={forecastResults} />
                  </div>
                )}

                {w.type === "drivers-bar" && forecastResults && (
                  <div className="mt-3 space-y-2">
                    {Object.entries(
                      forecastResults.multivariate.feature_importance
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([name, val]) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-24 truncate">
                            {name}
                          </span>
                          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{
                                width: `${Math.min(val * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-12 text-right">
                            {(val * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={prevStep}>
          ← Back
        </Button>
        <Button onClick={handleContinue} disabled={widgets.length === 0} size="lg">
          Continue to Showcase →
        </Button>
      </div>
    </div>
  );
}
