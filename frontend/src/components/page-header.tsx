export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="mono-label mb-3">{eyebrow}</p>}
        <h1 className="text-[26px] font-medium tracking-[-0.01em] sm:text-[32px]">
          {title}
        </h1>
        {lead && <p className="mt-2 text-[15px] text-muted-foreground measure">{lead}</p>}
      </div>
      {children}
    </div>
  );
}

/** Standard page frame: consistent max width, padding, and top rhythm. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      {children}
    </div>
  );
}
