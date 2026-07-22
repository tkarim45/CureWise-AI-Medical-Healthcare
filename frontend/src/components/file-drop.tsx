"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function FileDrop({
  accept,
  file,
  onFile,
  preview = false,
  hint,
}: {
  accept: string;
  file: File | null;
  onFile: (file: File | null) => void;
  preview?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handle = useCallback(
    (f: File | null) => {
      onFile(f);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return f && preview ? URL.createObjectURL(f) : null;
      });
    },
    [onFile, preview]
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handle(f);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-[var(--r-lg)] border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary-soft/60"
            : "border-border bg-surface hover:border-primary/50 hover:bg-surface-2"
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected preview"
            className="max-h-56 rounded-[var(--r-md)] object-contain"
          />
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary-strong">
            <Icon.Upload className="size-6" />
          </span>
        )}
        <span className="text-sm">
          {file ? (
            <span className="font-medium text-ink">{file.name}</span>
          ) : (
            <>
              <span className="font-medium text-primary-strong">Click to upload</span>
              <span className="text-muted"> or drag & drop</span>
            </>
          )}
        </span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handle(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
