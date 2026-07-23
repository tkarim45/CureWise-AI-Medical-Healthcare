"use client";

import { useState } from "react";
import { AiResponse } from "@/components/ai-response";
import { FileDrop } from "@/components/file-drop";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { api, ApiError } from "@/lib/api";

const ACCEPTED = ["image/jpeg", "image/png"];

export default function SkinPage() {
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ response: string } | null>(null);

  const canSubmit = !busy && image !== null;

  function pickImage(f: File | null) {
    setImage(f);
    setResult(null);
    setError(null);
  }

  async function submit() {
    if (!image) return;
    if (!ACCEPTED.includes(image.type)) {
      setError("Please upload a JPEG or PNG image.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.acneAnalysis(image);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't analyze the image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="04 · Skin check"
        title="Skin & acne check"
        lead="Upload a clear photo of the area. You'll get a calm first read and what to do next."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-5"
      >
        <FileDrop
          accept="image/jpeg,image/png"
          file={image}
          onFile={pickImage}
          preview
          hint="JPEG or PNG"
        />

        <div>
          <Button type="submit" loading={busy} disabled={!canSubmit}>
            Analyze photo
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-[var(--r-md)] border border-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <AiResponse text={result.response}>
            <Disclaimer className="mt-5 border-t border-border pt-4" />
          </AiResponse>
        </div>
      )}
    </PageShell>
  );
}
