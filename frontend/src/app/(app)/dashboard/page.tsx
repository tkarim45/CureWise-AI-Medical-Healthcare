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
      <header className="mb-9">
        <p className="text-muted-foreground">{greeting},</p>
        <h1 className="mt-1 text-[2rem] sm:text-[2.5rem] font-medium">
          {user?.username}
        </h1>
        <p className="mt-3 measure text-muted-foreground">
          Pick a tool below. Everything here is designed to help you understand
          your health calmly, then point you toward professional care.
        </p>
      </header>

      <section aria-label="Tools" className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool, i) => {
          const IconEl = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
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
                      {tool.label}
                    </h2>
                    <Icon.ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-strong" />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {ACCOUNT.map((item) => {
          const IconEl = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-[var(--r-md)] border border-border bg-surface px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <IconEl className="size-5 text-muted-foreground" />
              {item.label}
              <Icon.ArrowRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </section>

      <div className="mt-10 rounded-[var(--r-lg)] border border-border bg-surface-2/60 p-5">
        <Disclaimer />
      </div>
    </PageShell>
  );
}
