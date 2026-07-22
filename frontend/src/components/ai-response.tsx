import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Renders model text with light structure: **bold** inline, blank-line
 * paragraphs, and `- ` bullets. Deliberately minimal — no markdown dependency,
 * and it never injects raw HTML.
 */
function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyBase}-${i}`} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyBase}-${i}`}>{part}</span>
    )
  );
}

export function FormattedText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-3 leading-relaxed text-ink measure">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="flex flex-col gap-1.5 pl-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <Icon.Check className="mt-1 size-4 shrink-0 text-primary-strong" />
                  <span>{renderInline(l.replace(/^\s*[-*•]\s+/, ""), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={bi}>{renderInline(block, `${bi}`)}</p>;
      })}
    </div>
  );
}

export function AiResponse({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-lg)] border border-border bg-surface p-5 sm:p-6 animate-rise",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary-strong">
        <Icon.Spark className="size-4" />
        CureWise
      </div>
      <FormattedText text={text} />
      {children}
    </div>
  );
}
