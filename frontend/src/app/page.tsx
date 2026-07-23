"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Reveal, RevealObserver } from "@/components/reveal";
import { useAuth } from "@/lib/auth";

const TOOL_ROWS = [
  {
    index: "01",
    label: "Health assistant",
    lede: "Ask anything and get a grounded, plain-language answer.",
    outcomes: [
      "Answers grounded in a curated medical knowledge base",
      "Always points you toward professional care",
    ],
  },
  {
    index: "02",
    label: "Blood report reader",
    lede: "Upload a lab PDF and read it the way a patient clinician would explain it.",
    outcomes: [
      "Every value set against its reference range",
      "Follow-up questions without re-uploading",
    ],
  },
  {
    index: "03",
    label: "Image screening",
    lede: "Screen a medical image across seven trained models.",
    outcomes: [
      "Kidney CT, chest X-ray, retinal, histopathology, breast imaging and two blood models",
      "A result with confidence — never a diagnosis",
    ],
  },
  {
    index: "04",
    label: "Skin & acne check",
    lede: "A calm first read on a skin photo.",
    outcomes: [
      "Type, severity and location in plain words",
      "What to try first, and when to see a dermatologist",
    ],
  },
  {
    index: "05",
    label: "Nearby care",
    lede: "Hospitals around your location, when it matters most.",
    outcomes: ["Found in seconds from where you are", "One tap to directions"],
  },
];

const PROOF_CELLS = [
  {
    tag: "Plain language",
    heading: "Explained, not displayed",
    copy: "Medical terms come with analogies. Results come with what they mean and what to do next. No jargon, ever.",
  },
  {
    tag: "07 models",
    heading: "Screening that covers you",
    copy: "Kidney, lymphoma, pneumonia, eye disease, breast imaging, blood-cell type and AML markers — one account.",
  },
  {
    tag: "Honest by design",
    heading: "It cannot diagnose you",
    copy: "Every result states its limits and tells you when to see a doctor. That is a rule, not a footnote.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open your dashboard" : "Create your account";

  return (
    <div className="min-h-dvh">
      <RevealObserver />

      {/* Header */}
      <header className="frost sticky top-0 z-30 border-b border-border">
        <div className="site-container flex items-center justify-between py-3.5">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!loading &&
              (user ? (
                <Button size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Get started</Link>
                  </Button>
                </>
              ))}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="section">
          <div className="site-container">
            <Reveal>
              <span className="eyebrow">
                <span className="pulse-dot" aria-hidden />
                AI health companion
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="hero-title mt-6 max-w-3xl">
                Your health data exists. <b>The answers should too.</b>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                CureWise reads your lab reports, screens medical images across
                seven trained models, and answers your questions in plain
                language. Then it points you to real care.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button size="md" asChild>
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                {!user && (
                  <Button variant="secondary" size="md" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                )}
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-2">
                <span className="mono-label">07 screening models</span>
                <span className="mono-label">Plain language</span>
                <span className="mono-label">Informs · not diagnoses</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Tools — numbered ledger */}
        <section className="section border-t border-border-soft pt-0 sm:pt-0">
          <div className="site-container pt-16 sm:pt-20">
            <Reveal>
              <h2 className="headline max-w-2xl">
                One account. <b>Five ways to understand.</b>
              </h2>
            </Reveal>
            <div className="mt-10">
              {TOOL_ROWS.map((row, i) => (
                <Reveal key={row.index} delay={i * 40}>
                  <div className="ledger-row">
                    <span className="mono-index pt-1.5">{row.index}</span>
                    <div>
                      <h3 className="card-heading">{row.label}</h3>
                      <p className="mt-1 text-[15px] text-muted-foreground">
                        {row.lede}
                      </p>
                      <ul className="mt-3 flex flex-col gap-1.5">
                        {row.outcomes.map((o) => (
                          <li
                            key={o}
                            className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground"
                          >
                            <Icon.Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Proof — tinted band with hairline cell grid */}
        <section className="section section-band">
          <div className="site-container">
            <Reveal>
              <h2 className="headline max-w-2xl">
                Built calm on purpose. <b>Trust is the feature.</b>
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <div className="cellgrid mt-10 sm:grid-cols-3">
                {PROOF_CELLS.map((cell) => (
                  <div key={cell.tag} className="p-6">
                    <span className="mono-label">{cell.tag}</span>
                    <h3 className="card-heading mt-3">{cell.heading}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                      {cell.copy}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="site-container">
            <Reveal>
              <h2 className="headline max-w-2xl">
                Start with one report. <b>Understand it in minutes.</b>
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-4 max-w-lg text-[15px] text-muted-foreground">
                Free to start. One account, every tool. Your data stays yours.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="md" asChild>
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
                {!user && (
                  <Button variant="secondary" size="md" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-soft">
        <div className="site-container flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <Logo />
          <p className="mono-label">
            © {new Date().getFullYear()} · Informs, not diagnoses
          </p>
        </div>
      </footer>
    </div>
  );
}
