"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormattedText } from "@/components/ai-response";
import { FileDrop } from "@/components/file-drop";
import { Icon } from "@/components/icons";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError, type Classification, type DiseaseModel } from "@/lib/api";

const SEGMENT_CAPTIONS = ["Original", "Predicted mask", "Processed", "Overlay"];

/** Labels that read as a healthy / normal outcome get the calm success tone. */
function isHealthy(label: string): boolean {
  return /\b(normal|control|healthy|benign|negative|no[ -]?finding)\b/i.test(label);
}

type ChatTurn = { question: string; answer: string };

export default function ScreeningDiseasePage() {
  const params = useParams<{ disease: string }>();
  // Next 16: in a client component useParams() resolves synchronously.
  const disease = params.disease;

  const [model, setModel] = useState<DiseaseModel | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Disease chat
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingModel(true);
    setNotFound(false);
    setLoadError(null);
    api
      .listDiseaseModels()
      .then((models) => {
        if (!active) return;
        const found = models.find((m) => m.key === disease);
        if (found) setModel(found);
        else setNotFound(true);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load this model.");
      })
      .finally(() => active && setLoadingModel(false));
    return () => {
      active = false;
    };
  }, [disease]);

  function handleImage(f: File | null) {
    setImage(f);
    setResult(null);
    setError(null);
  }

  async function screen() {
    if (!image || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.classifyDisease(disease, image);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Screening failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function askChat() {
    const question = chatInput.trim();
    if (!question || chatBusy) return;
    setChatBusy(true);
    setChatError(null);
    setChatInput("");
    try {
      const res = await api.diseaseChat(disease, question);
      setTurns((t) => [...t, { question, answer: res.response }]);
    } catch (err) {
      setChatError(err instanceof ApiError ? err.message : "Couldn't reach the assistant.");
    } finally {
      setChatBusy(false);
    }
  }

  if (loadingModel) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 text-muted">
          <Spinner className="size-4" />
          <span className="text-sm">Loading…</span>
        </div>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell>
        <div className="rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
        <Link
          href="/screening"
          className="mt-6 inline-block text-sm text-muted transition-colors hover:text-ink"
        >
          ← All models
        </Link>
      </PageShell>
    );
  }

  if (notFound || !model) {
    return (
      <PageShell>
        <div className="rounded-[var(--r-lg)] border border-border bg-surface p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-[var(--r-md)] bg-surface-2 text-muted">
            <Icon.Scan className="size-6" />
          </span>
          <h2 className="mt-4 font-serif text-xl font-medium text-ink">Model not found</h2>
          <p className="mt-2 text-sm text-muted">
            We couldn&apos;t find a screening model for &ldquo;{disease}&rdquo;.
          </p>
          <Link
            href="/screening"
            className="mt-6 inline-block text-sm font-medium text-primary-strong transition-colors hover:brightness-110"
          >
            ← All models
          </Link>
        </div>
      </PageShell>
    );
  }

  const isSegmentation = model.kind === "segmentation";

  return (
    <PageShell>
      <Link
        href="/screening"
        className="mb-4 inline-block text-sm text-muted transition-colors hover:text-ink"
      >
        ← All models
      </Link>

      <PageHeader
        title={model.label}
        lead="Upload an image to screen. Educational only — always confirm with a clinician."
      />

      <div className="grid gap-6">
        <FileDrop
          accept="image/jpeg,image/png"
          file={image}
          onFile={handleImage}
          preview
          hint="JPEG or PNG"
        />

        <div>
          <Button onClick={screen} loading={busy} disabled={!image}>
            {busy ? "Screening…" : "Screen image"}
          </Button>
        </div>

        {error && (
          <div className="rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {result && (
          <div className="animate-rise rounded-[var(--r-lg)] border border-border bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary-strong">
              <Icon.Spark className="size-4" />
              Result
            </div>

            {isSegmentation ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted">Predicted class</span>
                  <Badge tone={isHealthy(result.predicted_class) ? "success" : "warning"}>
                    {result.predicted_class}
                  </Badge>
                </div>
                {result.images && result.images.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.images.map((img, i) => (
                      <figure
                        key={i}
                        className="overflow-hidden rounded-[var(--r-md)] border border-border bg-surface-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${img}`}
                          alt={SEGMENT_CAPTIONS[i] ?? `View ${i + 1}`}
                          className="w-full object-contain"
                        />
                        <figcaption className="border-t border-border px-3 py-2 text-xs text-muted">
                          {SEGMENT_CAPTIONS[i] ?? `View ${i + 1}`}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-serif text-2xl font-medium text-ink">
                    {result.predicted_class}
                  </span>
                  <Badge tone={isHealthy(result.predicted_class) ? "success" : "warning"}>
                    {isHealthy(result.predicted_class) ? "Looks normal" : "Worth a review"}
                  </Badge>
                </div>

                {typeof result.confidence === "number" && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Confidence</span>
                      <span className="font-mono tabular-nums text-ink">
                        {result.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-[var(--r-full)] bg-surface-2">
                      <div
                        className="h-full rounded-[var(--r-full)] bg-primary transition-[width] duration-500 ease-[var(--ease-out-quint)]"
                        style={{ width: `${Math.max(0, Math.min(100, result.confidence))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-border pt-4">
              <Disclaimer />
            </div>
          </div>
        )}

        {result && model.has_chat && (
          <div className="rounded-[var(--r-lg)] border border-border bg-surface p-5 sm:p-6">
            <h3 className="font-serif text-lg font-medium text-ink">
              Ask about {model.label}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Questions about this condition, what the result means, or next steps.
            </p>

            {turns.length > 0 && (
              <div className="mt-5 flex flex-col gap-5">
                {turns.map((t, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="self-end max-w-[85%] rounded-[var(--r-lg)] rounded-br-sm bg-primary px-4 py-2.5 text-on-primary">
                      {t.question}
                    </div>
                    <div className="max-w-full">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary-strong">
                        <Icon.Spark className="size-4" />
                        CureWise
                      </div>
                      <FormattedText text={t.answer} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {chatBusy && (
              <div className="mt-4 flex items-center gap-2 text-muted">
                <Spinner className="size-4" />
                <span className="text-sm">Thinking…</span>
              </div>
            )}

            {chatError && <p className="mt-3 text-sm text-danger">{chatError}</p>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askChat();
              }}
              className="mt-4"
            >
              <div className="flex items-end gap-2 rounded-[var(--r-lg)] border border-border bg-bg p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/35">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      askChat();
                    }
                  }}
                  rows={1}
                  placeholder={`Ask about ${model.label.toLowerCase()}…`}
                  className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-ink outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  loading={chatBusy}
                  disabled={!chatInput.trim()}
                  aria-label="Send"
                >
                  <Icon.Send className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageShell>
  );
}
