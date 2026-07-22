"use client";

import { useEffect, useId, useState } from "react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Field, Textarea, TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError, type Profile } from "@/lib/api";

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

const selectClass =
  "h-11 w-full rounded-[var(--r-md)] border border-border bg-bg px-3.5 text-ink " +
  "transition-[box-shadow,border-color] duration-150 " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/35 disabled:opacity-60";

type Editable = {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
};

const EMPTY: Editable = {
  first_name: "",
  last_name: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
};

function toForm(p: Profile): Editable {
  return {
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    phone: p.phone ?? "",
    date_of_birth: p.date_of_birth ?? "",
    gender: p.gender ?? "",
    address: p.address ?? "",
  };
}

export default function ProfilePage() {
  const genderId = useId();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Editable>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getProfile()
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setForm(toForm(p));
      })
      .catch((err) => {
        if (active)
          setLoadError(
            err instanceof ApiError ? err.message : "Couldn't load your profile."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  function set<K extends keyof Editable>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await api.updateProfile({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
      });
      setProfile(updated);
      setForm(toForm(updated));
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Couldn't save your changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const initial = profile?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <PageShell>
      <PageHeader title="Profile" lead="Your account details." />

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner className="size-4" />
          <span className="text-sm">Loading your profile…</span>
        </div>
      ) : loadError ? (
        <div className="rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {loadError}
        </div>
      ) : (
        profile && (
          <>
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-xl font-semibold text-primary-strong">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="font-serif text-lg font-medium text-ink">
                  {profile.username}
                </p>
                <p className="truncate text-sm text-muted">{profile.email}</p>
              </div>
            </div>

            <form
              onSubmit={save}
              className="mt-8 rounded-[var(--r-lg)] border border-border bg-surface p-5 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First name"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  placeholder="Your first name"
                />
                <TextField
                  label="Last name"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  placeholder="Your last name"
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="e.g. +1 555 123 4567"
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
                <Field label="Gender" htmlFor={genderId}>
                  <select
                    id={genderId}
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Prefer not to say</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Textarea
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Street, city, postal code"
                    />
                  </Field>
                </div>
              </div>

              {saveError && (
                <div className="mt-5 rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                  {saveError}
                </div>
              )}

              {saved && (
                <div className="mt-5 rounded-[var(--r-md)] border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success">
                  Profile updated
                </div>
              )}

              <div className="mt-6">
                <Button type="submit" loading={saving} disabled={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          </>
        )
      )}
    </PageShell>
  );
}
