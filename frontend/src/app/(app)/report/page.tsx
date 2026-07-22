"use client";

import { useState } from "react";
import { AiResponse } from "@/components/ai-response";
import { FileDrop } from "@/components/file-drop";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Field, Textarea } from "@/components/ui/field";
import { api, ApiError, type StructuredReport } from "@/lib/api";

type Result = { structured_report: StructuredReport | null; response: string };

type Tone = "neutral" | "success" | "warning" | "danger";

const URGENT = /\b(critical|urgent|severe|panic|alarm|danger)\b/i;

function statusTone(remark?: string): { tone: Tone; label: string } {
  const r = (remark ?? "").trim();
  if (!r) return { tone: "neutral", label: "—" };
  if (URGENT.test(r)) return { tone: "danger", label: r };
  if (/^normal$/i.test(r)) return { tone: "success", label: r };
  if (/\b(high|low)\b/i.test(r)) return { tone: "warning", label: r };
  return { tone: "neutral", label: r };
}

export default function ReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const canSubmit = !busy && (file !== null || question.trim().length > 0);

  function pickFile(f: File | null) {
    setFile(f);
    setResult(null);
    setError(null);
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.medicalReport(question.trim() || null, file);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't read the report.");
    } finally {
      setBusy(false);
    }
  }

  const patient = result?.structured_report?.patient_info;
  const rows = result?.structured_report?.haematology_results;

  return (
    <PageShell>
      <PageHeader
        title="Blood report reader"
        lead="Upload a lab PDF and get it explained in plain, calm language. You can also ask a follow-up question."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-5"
      >
        <FileDrop
          accept="application/pdf,.pdf"
          file={file}
          onFile={pickFile}
          hint="PDF up to ~10MB"
        />

        <Field label="Ask a question about your report (optional)">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Is my hemoglobin in a healthy range?"
          />
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={busy} disabled={!canSubmit}>
            Explain my report
          </Button>
          {!file && !question.trim() && (
            <span className="text-sm text-muted-foreground">
              Upload a PDF or ask a question to begin.
            </span>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-[var(--r-md)] border border-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 flex flex-col gap-6">
          {rows && rows.length > 0 && (
            <div className="rounded-[var(--r-lg)] border border-border bg-surface p-5 sm:p-6 animate-rise">
              {patient && (patient.age || patient.gender) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {patient.age && <Badge tone="neutral">Age {patient.age}</Badge>}
                  {patient.gender && <Badge tone="neutral">{patient.gender}</Badge>}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Test</th>
                      <th className="py-2 pr-4 font-medium">Value</th>
                      <th className="py-2 pr-4 font-medium">Unit</th>
                      <th className="py-2 pr-4 font-medium">Reference</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const { tone, label } = statusTone(row.remark);
                      return (
                        <tr key={i} className="border-b border-border/60 last:border-0">
                          <td className="py-2.5 pr-4 text-ink">{row.test}</td>
                          <td className="py-2.5 pr-4 font-mono tabular text-ink">
                            {row.patient_value}
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{row.unit || "—"}</td>
                          <td className="py-2.5 pr-4 font-mono tabular text-muted-foreground">
                            {row.reference_value || "—"}
                          </td>
                          <td className="py-2.5">
                            <Badge tone={tone}>{label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <AiResponse text={result.response}>
            <Disclaimer className="mt-5 border-t border-border pt-4" />
          </AiResponse>
        </div>
      )}
    </PageShell>
  );
}
