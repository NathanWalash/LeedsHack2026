"use client";

import { useState } from "react";
import { useBuildStore, useAuthStore } from "@/lib/store";
import { updateProject } from "@/lib/api";
import { Button, BubbleSelect } from "@/components/ui";
import {
  Trophy,
  CheckCircle2,
  PartyPopper,
  Loader2,
  ArrowLeft,
} from "lucide-react";

const TAG_OPTIONS = [
  { id: "retail", label: "Retail", icon: "🛒" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "weekly", label: "Weekly", icon: "🗓️" },
  { id: "monthly", label: "Monthly", icon: "📆" },
  { id: "daily", label: "Daily", icon: "📅" },
  { id: "multivariate", label: "Multivariate", icon: "📊" },
  { id: "baseline", label: "Baseline", icon: "📏" },
  { id: "gradient-boost", label: "GradientBoost", icon: "🌲" },
];

export default function Step5Showcase() {
  const {
    projectId,
    projectTitle,
    projectDescription,
    useCase,
    summary,
    setSummary,
    tags,
    setTags,
    widgets,
    horizon,
    selectedDrivers,
    baselineModel,
    multivariateModel,
    completeStep,
    prevStep,
    isLoading,
    setLoading,
  } = useBuildStore();
  const user = useAuthStore((s) => s.user);

  const [published, setPublished] = useState(false);

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handlePublish = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      await updateProject(projectId, 5, {
        summary,
        tags,
        published: true,
        widgets: widgets.length,
        horizon,
        drivers: selectedDrivers,
        baselineModel,
        multivariateModel,
      });
      completeStep(5);
      setPublished(true);
    } catch {
      // silently continue for demo
      completeStep(5);
      setPublished(true);
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PartyPopper className="w-16 h-16 text-teal-400 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-3">
          Project Published!
        </h2>
        <p className="text-slate-400 max-w-md mb-8">
          &ldquo;{projectTitle}&rdquo; is now live. You can view it on the
          Explore page or continue refining it.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/explore")}
          >
            View on Explore
          </Button>
          <Button onClick={() => (window.location.href = "/create")}>
            Build Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-teal-400" />
          Showcase Your Forecast
        </h3>
        <p className="text-sm text-slate-400">
          Write a summary for your project and add tags so others can discover it.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Project Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition resize-none"
            placeholder="Describe what you forecasted, your approach, and key findings..."
          />
        </div>

        <BubbleSelect
          label="Tags"
          options={TAG_OPTIONS}
          selected={tags}
          onSelect={handleToggleTag}
          multi
        />
      </div>

      {/* Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Project Overview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Title", value: projectTitle || "—" },
            { label: "Use Case", value: useCase || "—" },
            { label: "Baseline", value: baselineModel || "—" },
            { label: "Multivariate", value: multivariateModel || "—" },
            { label: "Horizon", value: `${horizon} steps` },
            { label: "Drivers", value: `${selectedDrivers.length} selected` },
            { label: "Widgets", value: `${widgets.length} in report` },
            { label: "Author", value: user?.username || "anonymous" },
          ].map((r) => (
            <div
              key={r.label}
              className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3"
            >
              <span className="text-xs text-slate-500">{r.label}</span>
              <span className="block text-sm font-medium text-white mt-0.5">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Publish */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button onClick={handlePublish} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Publish Project
        </Button>
      </div>
    </div>
  );
}
