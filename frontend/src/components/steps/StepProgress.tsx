"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  completedSteps: number[];
  steps: { label: string; icon: React.ReactNode }[];
  onStepClick: (step: number) => void;
  debugMode?: boolean;
}

export default function StepProgress({
  currentStep,
  completedSteps,
  steps,
  onStepClick,
  debugMode = false,
}: StepProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const num = i + 1;
        const isDone = completedSteps.includes(num);
        const isCurrent = currentStep === num;
        const isAccessible = debugMode || isDone || isCurrent || completedSteps.includes(num - 1);

        return (
          <React.Fragment key={num}>
            <button
              onClick={() => isAccessible && onStepClick(num)}
              disabled={!isAccessible}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                isCurrent &&
                  "bg-teal-600/20 border border-teal-500/50 text-teal-300",
                isDone &&
                  !isCurrent &&
                  "bg-slate-800/60 border border-slate-700 text-slate-400 hover:border-slate-600 cursor-pointer",
                !isDone &&
                  !isCurrent &&
                  "bg-slate-900/40 border border-slate-800 text-slate-600 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                  isDone && "bg-teal-600 text-white",
                  isCurrent && !isDone && "bg-teal-500/30 text-teal-300",
                  !isDone && !isCurrent && "bg-slate-800 text-slate-600"
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : num}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>

            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-6 h-px",
                  isDone ? "bg-teal-600/50" : "bg-slate-800"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
