export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[1.9rem] sm:text-[2.25rem] font-medium">{title}</h1>
        {lead && <p className="mt-2 text-muted-foreground measure">{lead}</p>}
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
