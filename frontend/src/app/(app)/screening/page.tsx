"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, PageShell } from "@/components/page-header";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError, type DiseaseModel } from "@/lib/api";

/** Imaging modality per model — combined with the model's own labels for an
 *  accurate, human-readable sublabel. */
const MODALITY: Record<string, string> = {
  kidney: "CT scan",
  "blood-marker": "Blood smear",
  "blood-cell-type": "Microscopy",
  lymphoma: "Histopathology",
  "breast-cancer": "Ultrasound",
  pneumonia: "Chest X-ray",
  "eye-disease": "Retinal image",
};

function iconFor(key: string) {
  if (key === "kidney" || key === "blood-marker" || key === "blood-cell-type") {
    return Icon.Blood;
  }
  return Icon.Scan;
}

function sublabel(model: DiseaseModel): string {
  const modality = MODALITY[model.key] ?? "Medical image";
  if (model.kind === "segmentation") {
    return `${modality} → highlights the region of interest`;
  }
  return `${modality} → ${model.labels.join(" / ")}`;
}

export default function ScreeningPage() {
  const [models, setModels] = useState<DiseaseModel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listDiseaseModels()
      .then((res) => active && setModels(res))
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load screening models.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Image screening"
        lead="Choose what to screen. Each tool uses a model trained for that condition. These are educational screens, not diagnoses."
      />

      {error ? (
        <div className="rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : models === null ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner className="size-4" />
          <span className="text-sm">Loading models…</span>
        </div>
      ) : (
        <section aria-label="Screening models" className="grid gap-4 sm:grid-cols-2">
          {models.map((model, i) => {
            const IconEl = iconFor(model.key);
            return (
              <Link
                key={model.key}
                href={`/screening/${model.key}`}
                className="group animate-rise rounded-[var(--r-lg)] border border-border bg-surface p-5 transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--shadow-md)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[var(--r-md)] bg-primary-soft text-primary-strong">
                    <IconEl className="size-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg font-medium text-ink">
                        {model.label}
                      </h2>
                      <Icon.ArrowRight className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-strong" />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {sublabel(model)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <div className="mt-10 rounded-[var(--r-lg)] border border-border bg-surface-2/60 p-5">
        <Disclaimer />
      </div>
    </PageShell>
  );
}
