"use client";

import { useTheme } from "@/components/theme-provider";
import { Icon } from "@/components/icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={
        "inline-flex size-10 items-center justify-center rounded-[var(--r-md)] " +
        "text-muted hover:text-ink hover:bg-surface-2 transition-colors " +
        (className ?? "")
      }
    >
      {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
    </button>
  );
}
