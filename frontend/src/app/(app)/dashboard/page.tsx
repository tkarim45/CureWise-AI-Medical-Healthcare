"use client";

import Link from "next/link";
import { ACCOUNT, TOOLS } from "@/components/nav-config";
import { Icon } from "@/components/icons";
import { Disclaimer } from "@/components/ui/disclaimer";
import { PageShell } from "@/components/page-header";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PageShell>
      <header className="mb-10">
        <p className="mono-label">{greeting}</p>
        <h1 className="mt-2 text-[28px] font-medium tracking-[-0.01em] sm:text-[34px]">
          {user?.username}
        </h1>
        <p className="mt-3 measure text-[15px] text-muted-foreground">
          Pick a tool below. Everything here helps you understand your health
          calmly, then points you toward professional care.
        </p>
      </header>

      <section aria-label="Tools" className="cellgrid sm:grid-cols-2">
        {TOOLS.map((tool, i) => {
          const IconEl = tool.icon;
          const index = String(i + 1).padStart(2, "0");
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="hover-flood group block p-6"
            >
              <div className="flex items-center justify-between">
                <span className="mono-index">{index}</span>
                <IconEl className="size-5 text-muted-foreground" />
              </div>
              <h2 className="card-heading mt-5 text-foreground">{tool.label}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {tool.description}
              </p>
            </Link>
          );
        })}
        {/* Filler cell keeps the hairline grid rectangular on even columns */}
        {TOOLS.length % 2 === 1 && (
          <div className="hidden items-end p-6 sm:flex">
            <p className="mono-label">Informs · not diagnoses</p>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {ACCOUNT.map((item) => {
          const IconEl = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-[var(--r-md)] border border-border px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <IconEl className="size-5 text-muted-foreground" />
              {item.label}
              <Icon.ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </section>

      <div className="mt-10 rounded-[var(--r-lg)] border border-border-soft bg-surface-2 p-5">
        <Disclaimer />
      </div>
    </PageShell>
  );
}
