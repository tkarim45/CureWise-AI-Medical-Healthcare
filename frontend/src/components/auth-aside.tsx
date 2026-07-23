const POINTS = [
  {
    index: "01",
    heading: "Blood reports, explained",
    copy: "Every value set against its reference range, in plain words.",
  },
  {
    index: "02",
    heading: "Seven screening models",
    copy: "Kidney, lymphoma, pneumonia, eye, breast imaging and two blood models.",
  },
  {
    index: "03",
    heading: "A grounded assistant",
    copy: "Answers come from a curated medical knowledge base, never a guess.",
  },
];

/** The right-hand panel on auth screens. Bryge band + mono ledger. */
export function AuthAside() {
  return (
    <aside className="hidden border-l border-border bg-surface-2 lg:block">
      <div className="flex h-full flex-col justify-center px-14">
        <p className="mono-label">Why CureWise</p>
        <p className="mt-4 max-w-md text-[28px] font-light leading-snug tracking-[-0.02em] text-foreground">
          Understand what your health is telling you. <b className="font-semibold">Calmly.</b>
        </p>

        <div className="mt-10 max-w-md">
          {POINTS.map((p) => (
            <div key={p.index} className="ledger-row !py-5">
              <span className="mono-index pt-0.5">{p.index}</span>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">{p.heading}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                  {p.copy}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mono-label mt-12">Informs · not diagnoses</p>
      </div>
    </aside>
  );
}
