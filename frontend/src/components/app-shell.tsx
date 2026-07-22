"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCOUNT, TOOLS, type NavItem } from "@/components/nav-config";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const IconEl = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary-strong"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <IconEl
        className={cn(
          "size-5 shrink-0",
          active ? "text-primary-strong" : "text-muted-foreground group-hover:text-foreground"
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
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        <NavLink
          item={{ href: "/dashboard", label: "Home", description: "", icon: Icon.Home }}
          active={pathname === "/dashboard"}
          onClick={onNavigate}
        />
        <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tools
        </p>
        {TOOLS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
        ))}
        <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        {ACCOUNT.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
        ))}
      </nav>

      <Separator />
      <div className="p-3">
        <div className="flex items-center gap-3 px-1 py-1.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary-soft text-sm font-semibold text-primary-strong">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <Icon.Logout className="size-[18px]" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-sidebar md:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Icon.Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
