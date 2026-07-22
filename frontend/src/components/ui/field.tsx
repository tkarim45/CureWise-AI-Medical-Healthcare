"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export { Input, Textarea };

type FieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
};

export function Field({ label, hint, error, children, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  hint?: string;
  error?: string;
};

/** Field + Input combo with a generated id, the common case. */
export function TextField({ label, hint, error, ...input }: TextFieldProps) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <Input id={id} aria-invalid={!!error} className="h-11" {...input} />
    </Field>
  );
}
