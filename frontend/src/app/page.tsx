"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TOOLS } from "@/components/nav-config";
import { useAuth } from "@/lib/auth";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open your dashboard" : "Create your account";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!loading &&
              (user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center rounded-[var(--r-md)] bg-primary px-4 text-sm font-medium text-on-primary transition-[filter] hover:brightness-[1.08]"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-[var(--r-md)] px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2 sm:inline-block"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-9 items-center rounded-[var(--r-md)] bg-primary px-4 text-sm font-medium text-on-primary transition-[filter] hover:brightness-[1.08]"
                  >
                    Get started
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(48rem 40rem at 78% -8%, var(--primary-soft), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
            <p className="flex items-center gap-2 text-sm font-medium text-primary-strong">
              <Icon.Spark className="size-4" />
              Your calm AI health companion
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[2.6rem] font-medium leading-[1.08] sm:text-[3.4rem]">
              Understand what your health is telling you.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Upload a blood report and read it in plain words. Screen a photo
              across seven trained models. Ask a grounded assistant. CureWise
              helps you understand, then points you to professional care.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center gap-2 rounded-[var(--r-md)] bg-primary px-6 font-medium text-on-primary shadow-[var(--shadow-sm)] transition-[filter] hover:brightness-[1.08]"
              >
                {primaryLabel}
                <Icon.ArrowRight className="size-5" />
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-[var(--r-md)] border border-border bg-surface px-6 font-medium text-ink hover:bg-surface-2"
                >
                  Sign in
                </Link>
              )}
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Icon.Info className="size-4" />
              Informs, does not diagnose. Always confirm with a clinician.
            </p>
          </div>
        </section>

        {/* Tools — editorial list, not a card grid */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="font-serif text-2xl font-medium sm:text-3xl">
              Five tools, one calm account
            </h2>
            <div className="mt-10 divide-y divide-border">
              {TOOLS.map((tool) => {
                const IconEl = tool.icon;
                return (
                  <div
                    key={tool.href}
                    className="grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-1 py-6 sm:grid-cols-[3rem_16rem_1fr] sm:items-center"
                  >
                    <span className="grid size-11 place-items-center rounded-[var(--r-md)] bg-primary-soft text-primary-strong">
                      <IconEl className="size-[22px]" />
                    </span>
                    <h3 className="font-serif text-xl font-medium text-ink">
                      {tool.label}
                    </h3>
                    <p className="col-start-2 text-muted sm:col-start-3">
                      {tool.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-3 sm:px-8 sm:py-20">
            {[
              { k: "Plain language", v: "Every result is explained the way a patient clinician would, no jargon." },
              { k: "Seven models", v: "Kidney, lymphoma, pneumonia, eye, breast imaging, and two blood models." },
              { k: "Honest by design", v: "CureWise states its limits on every result. It informs; it never diagnoses." },
            ].map((item) => (
              <div key={item.k}>
                <h3 className="font-serif text-xl font-medium text-ink">{item.k}</h3>
                <p className="mt-2 text-muted">{item.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8">
            <h2 className="mx-auto max-w-2xl font-serif text-[2rem] font-medium sm:text-4xl">
              Start understanding your health today.
            </h2>
            <div className="mt-8">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center gap-2 rounded-[var(--r-md)] bg-primary px-7 font-medium text-on-primary transition-[filter] hover:brightness-[1.08]"
              >
                {primaryLabel}
                <Icon.ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:px-8">
          <Logo />
          <p>CureWise informs, and does not diagnose. © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
