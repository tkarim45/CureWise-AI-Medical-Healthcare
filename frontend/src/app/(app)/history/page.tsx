"use client";

import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError, type MedicalHistory } from "@/lib/api";

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sortNewestFirst(entries: MedicalHistory[]): MedicalHistory[] {
  return [...entries].sort((a, b) => {
    const at = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bt - at;
  });
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listMedicalHistory()
      .then((data) => {
        if (active) setEntries(sortNewestFirst(data));
      })
      .catch((err) => {
        if (active)
          setLoadError(
            err instanceof ApiError ? err.message : "Couldn't load your medical history."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const canSave =
    !saving &&
    (conditions.trim().length > 0 ||
      allergies.trim().length > 0 ||
      notes.trim().length > 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const entry = await api.addMedicalHistory({
        conditions: conditions.trim() || undefined,
        allergies: allergies.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setEntries((prev) => [entry, ...prev]);
      setConditions("");
      setAllergies("");
      setNotes("");
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Couldn't save this entry. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Medical history"
        lead="Keep your conditions, allergies and notes in one place. Only you can see this."
      />

      <div className="rounded-[var(--r-lg)] border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-serif text-lg font-medium text-ink">Add an entry</h2>
        <p className="mt-1 text-sm text-muted">
          Fill in what's relevant — at least one field is enough to save.
        </p>
        <form onSubmit={save} className="mt-5 flex flex-col gap-4">
          <Field label="Conditions">
            <Textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="e.g. Type 2 diabetes, hypertension"
            />
          </Field>
          <Field label="Allergies">
            <Textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, peanuts"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else worth remembering"
            />
          </Field>

          {saveError && (
            <div className="rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {saveError}
            </div>
          )}

          <div>
            <Button type="submit" loading={saving} disabled={!canSave}>
              Save entry
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium text-ink">Your entries</h2>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-muted">
            <Spinner className="size-4" />
            <span className="text-sm">Loading your history…</span>
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {loadError}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-6 rounded-[var(--r-lg)] border border-border bg-surface-2/60 p-6 sm:p-8">
            <p className="measure text-muted">
              You haven't added anything yet. Use the form above to record your
              conditions, allergies and notes — they'll appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {entries.map((entry, i) => {
              const date = formatDate(entry.updated_at);
              return (
                <li
                  key={entry.id}
                  className="animate-rise rounded-[var(--r-lg)] border border-border bg-surface p-5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex flex-col gap-4">
                    {entry.conditions && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Conditions
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">
                          {entry.conditions}
                        </p>
                      </div>
                    )}
                    {entry.allergies && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Allergies
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">
                          {entry.allergies}
                        </p>
                      </div>
                    )}
                    {entry.notes && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">
                          {entry.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  {date && (
                    <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                      Updated {date}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
