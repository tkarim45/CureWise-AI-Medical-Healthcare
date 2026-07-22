import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * The persistent honesty note. Part of the product, not fine print.
 * Shown alongside every AI result.
 */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-sm text-muted leading-relaxed",
        className
      )}
    >
      <Icon.Info className="mt-0.5 size-4 shrink-0 text-muted" />
      <span>
        CureWise gives educational information to help you understand your health.
        It does not diagnose. Always confirm with a qualified healthcare
        professional.
      </span>
    </p>
  );
}
