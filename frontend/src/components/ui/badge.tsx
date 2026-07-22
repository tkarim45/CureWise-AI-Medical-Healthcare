import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-medium whitespace-nowrap [&>svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-secondary text-muted-foreground",
        primary: "bg-primary-soft text-primary-strong",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}

export { badgeVariants };
