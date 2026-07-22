import { cn } from "@/lib/utils";

/** CureWise wordmark: a calm pulse mark + serif wordmark. */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        width={28}
        height={28}
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="9" fill="var(--primary)" />
        <path
          d="M6 17h4l2.2-5 3 10 2.4-7 1.6 2h4.8"
          fill="none"
          stroke="var(--on-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-serif text-[1.35rem] font-medium tracking-tight text-ink">
          CureWise
        </span>
      )}
    </span>
  );
}
