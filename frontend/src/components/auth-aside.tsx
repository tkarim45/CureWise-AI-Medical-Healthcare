import { Icon } from "@/components/icons";

const POINTS = [
  { icon: Icon.Report, text: "Blood reports, explained in plain language." },
  { icon: Icon.Scan, text: "Image screening across seven trained models." },
  { icon: Icon.Chat, text: "A grounded assistant that never guesses wildly." },
];

/** The calm right-hand panel on auth screens. Decorative, hidden on small screens. */
export function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-surface-2 lg:block">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(60rem 60rem at 85% -10%, var(--primary-soft), transparent 55%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-center px-14">
        <p className="font-serif text-[2rem] leading-snug text-ink max-w-md">
          Understand what your health is telling you, calmly.
        </p>
        <ul className="mt-10 flex flex-col gap-5">
          {POINTS.map((p, i) => {
            const IconEl = p.icon;
            return (
              <li key={i} className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-[var(--r-md)] border border-border bg-surface text-primary-strong">
                  <IconEl className="size-5" />
                </span>
                <span className="text-ink">{p.text}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-12 max-w-sm text-sm text-muted">
          CureWise informs; it does not diagnose. Always confirm findings with a
          qualified healthcare professional.
        </p>
      </div>
    </aside>
  );
}
