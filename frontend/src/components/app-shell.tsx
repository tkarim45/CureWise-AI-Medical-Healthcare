"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCOUNT, TOOLS, type NavItem } from "@/components/nav-config";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const IconEl = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary-strong"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      )}
    >
      <IconEl
        className={cn(
          "size-5 shrink-0",
          active ? "text-primary-strong" : "text-muted group-hover:text-ink"
        )}
      />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="px-3 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        <NavLink
          item={{
            href: "/dashboard",
            label: "Home",
            description: "",
            icon: Icon.Home,
          }}
          active={pathname === "/dashboard"}
          onClick={onNavigate}
        />
        <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Tools
        </p>
        {TOOLS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
        ))}
        <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Account
        </p>
        {ACCOUNT.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-[var(--r-md)] px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user?.username}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="inline-flex items-center gap-2 rounded-[var(--r-md)] px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <Icon.Logout className="size-[18px]" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[17rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface md:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-[var(--r-md)] text-ink hover:bg-surface-2"
        >
          <Icon.Menu />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-border bg-surface shadow-[var(--shadow-lg)] animate-[slidein_.25s_var(--ease-out-expo)]">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 inline-flex size-9 items-center justify-center rounded-[var(--r-md)] text-muted hover:bg-surface-2"
            >
              <Icon.Close />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0">{children}</main>
    </div>
  );
}
