"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] text-sm font-medium whitespace-nowrap outline-none transition-[background-color,box-shadow,filter,transform] duration-150 ease-[var(--ease-out-quint)] select-none focus-visible:ring-3 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-55 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.05em]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:brightness-[1.07]",
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:brightness-[1.07]",
        destructive:
          "bg-destructive text-white shadow-[var(--shadow-sm)] hover:brightness-[1.07]",
        secondary:
          "border border-border bg-card text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary",
        danger:
          "bg-destructive text-white shadow-[var(--shadow-sm)] hover:brightness-[1.07]",
        link: "text-primary-strong underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 gap-1 px-2 text-xs",
        sm: "h-9 px-3.5 text-[0.85rem]",
        default: "h-11 px-5",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-[0.95rem]",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
