"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useBuildStore, useAuthStore } from "@/lib/store";
import { uploadFile, createProject } from "@/lib/api";
import { Input, BubbleSelect, Button } from "@/components/ui";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const USE_CASE_OPTIONS = [
  { id: "retail", label: "Retail & Sales", icon: "🛒" },
  { id: "energy", label: "Energy & Utilities", icon: "⚡" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "supply-chain", label: "Supply Chain", icon: "📦" },
  { id: "other", label: "Other", icon: "🔧" },
];

export default function Step1GetStarted() {
  const {
    projectTitle,
    setProjectTitle,
    projectDescription,
    setProjectDescription,
    useCase,
    setUseCase,
    uploadedFiles,
    addUploadedFile,
    setFileInfo,
    setProjectId,
    completeStep,
    nextStep,
    isLoading,
    setLoading,
    setLoadingMessage,
  } = useBuildStore();
  const user = useAuthStore((s) => s.user);

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setLoading(true);
      setLoadingMessage("Uploading & analyzing file...");
      setUploadStatus("idle");
      setErrorMsg("");

      try {
        // Create project if needed
        if (!useBuildStore.getState().projectId && user) {
          const proj = await createProject(
            user.user_id,
            projectTitle || file.name.replace(/\.[^.]+$/, ""),
            projectDescription
          );
          setProjectId(proj.project_id);
        }

        const result = await uploadFile(file);
        addUploadedFile(file.name);
        setFileInfo({
          columns: result.columns || [],
          numericColumns: result.numeric_columns || [],
          detectedDateCol: result.detected_date_col || null,
          rowCount: result.row_count || 0,
        });
        setUploadStatus("success");
      } catch (err: any) {
        setErrorMsg(
          err?.response?.data?.detail || "Upload failed. Try again."
        );
        setUploadStatus("error");
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    },
    [
      user,
      projectTitle,
      projectDescription,
      setProjectId,
      addUploadedFile,
      setFileInfo,
      setLoading,
      setLoadingMessage,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const canContinue =
    uploadedFiles.length > 0 && uploadStatus === "success";

  const handleContinue = () => {
    completeStep(1);
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Project Details */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white">Project Details</h3>
        <Input
          label="Project Title"
          placeholder="e.g. Weekly Sales Forecast"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
        />
        <Input
          label="Description (optional)"
          placeholder="What are you forecasting and why?"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
        />
        <BubbleSelect
          label="Use Case"
          options={USE_CASE_OPTIONS}
          selected={useCase}
          onSelect={setUseCase}
        />
      </div>

      {/* Upload */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Data</h3>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-teal-500 bg-teal-900/10"
              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {isDragActive
              ? "Drop it here!"
              : "Drag & drop a CSV file, or click to browse"}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Accepts .csv files with a date column and at least one numeric column
          </p>
        </div>

        {/* Status */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-3 text-teal-400 text-sm">
            <div className="w-4 h-4 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            Uploading & analyzing...
          </div>
        )}
        {uploadStatus === "success" && (
          <div className="mt-4 flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            File uploaded successfully
          </div>
        )}
        {uploadStatus === "error" && (
          <div className="mt-4 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        {/* Uploaded file chips */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {uploadedFiles.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-300"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!canContinue} size="lg">
          Continue to Process Data →
        </Button>
      </div>
    </div>
  );
}
