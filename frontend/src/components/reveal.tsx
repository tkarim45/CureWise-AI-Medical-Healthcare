"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll reveal, Bryge rules: content is visible by default; hiding is only
 * armed once the IntersectionObserver is wired, and a ~1.8s failsafe reveals
 * everything. A page must never stay invisible if JS fails.
 *
 * Mount <RevealObserver /> once per page, then put `reveal` on elements.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    // Arm hiding only now that the observer exists.
    root.classList.add("reveal-armed");
    els.forEach((el) => io.observe(el));

    // Failsafe: reveal everything after 1.8s no matter what.
    const failsafe = window.setTimeout(() => {
      els.forEach((el) => el.classList.add("reveal-in"));
    }, 1800);

    return () => {
      window.clearTimeout(failsafe);
      io.disconnect();
      root.classList.remove("reveal-armed");
    };
  }, []);

  return null;
}

export function Reveal({
  as: Tag = "div",
  className,
  children,
  delay,
}: {
  as?: "div" | "section" | "li" | "span";
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Tag
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
