"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError, type Hospital } from "@/lib/api";

type Phase = "idle" | "locating" | "loading" | "done";

export default function EmergencyPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState<string | null>(null);

  function findHospitals() {
    setError(null);
    setHospitals([]);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location isn't available in this browser. Please search for hospitals manually.");
      return;
    }

    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPhase("loading");
        try {
          const res = await api.nearbyHospitals(latitude, longitude);
          setHospitals(res.hospitals);
          setPhase("done");
        } catch (err) {
          setError(
            err instanceof ApiError ? err.message : "Couldn't find hospitals right now. Please try again."
          );
          setPhase("idle");
        }
      },
      (geoErr) => {
        const message =
          geoErr.code === geoErr.PERMISSION_DENIED
            ? "Location access was denied. Please allow location, or search for hospitals manually."
            : geoErr.code === geoErr.POSITION_UNAVAILABLE
              ? "We couldn't determine your location. Please try again in a moment."
              : "Finding your location took too long. Please try again.";
        setError(message);
        setPhase("idle");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  const busy = phase === "locating" || phase === "loading";

  return (
    <PageShell>
      <PageHeader
        title="Nearby care"
        lead="Find hospitals near your current location. In a real emergency, call your local emergency number first."
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-[var(--r-md)] bg-primary-soft text-primary-strong">
          <Icon.Siren className="size-[22px]" />
        </span>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={findHospitals} loading={busy} disabled={busy}>
          Find hospitals near me
        </Button>
        {phase === "locating" && (
          <span className="text-sm text-muted">Getting your location…</span>
        )}
        {phase === "loading" && (
          <span className="text-sm text-muted">Finding hospitals nearby…</span>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-[var(--r-md)] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      {busy && (
        <div className="mt-8 flex items-center gap-2 text-muted">
          <Spinner className="size-4" />
          <span className="text-sm">
            {phase === "locating" ? "Locating you…" : "Searching for care nearby…"}
          </span>
        </div>
      )}

      {phase === "idle" && !error && (
        <div className="mt-8 rounded-[var(--r-lg)] border border-border bg-surface-2/60 p-6 sm:p-8">
          <h2 className="font-serif text-lg font-medium text-ink">
            Ready when you are
          </h2>
          <p className="mt-2 measure text-muted">
            Tap the button above to share your location and see hospitals close to
            you. We only use your location for this search — it isn't stored.
          </p>
        </div>
      )}

      {phase === "done" && hospitals.length === 0 && (
        <div className="mt-8 rounded-[var(--r-lg)] border border-border bg-surface p-6 sm:p-8">
          <h2 className="font-serif text-lg font-medium text-ink">
            No hospitals found nearby
          </h2>
          <p className="mt-2 measure text-muted">
            We couldn't find any hospitals close to your location. If this is an
            emergency, call your local emergency number right away.
          </p>
        </div>
      )}

      {phase === "done" && hospitals.length > 0 && (
        <ul className="mt-8 flex flex-col gap-3">
          {hospitals.map((h, i) => {
            const mapsQuery = `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`;
            const osmQuery = `https://www.openstreetmap.org/?mlat=${h.lat}&mlon=${h.lng}#map=17/${h.lat}/${h.lng}`;
            return (
              <li
                key={`${h.name}-${i}`}
                className="animate-rise rounded-[var(--r-lg)] border border-border bg-surface p-5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg font-medium text-ink">
                      {h.name}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {h.address}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <a href={mapsQuery} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" size="sm">
                        Get directions
                      </Button>
                    </a>
                    <a href={osmQuery} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm">
                        Directions
                      </Button>
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
