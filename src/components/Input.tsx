import type React from "react";
import { cx } from "@/lib/classNames";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = ({ label, className, ...props }: InputProps) => (
  <label className="flex flex-col gap-2 text-sm text-white/80">
    {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
    <input
      className={cx(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        "px-4 py-3 text-sm text-white placeholder:text-white/30",
        "focus:border-[var(--accent)] focus:outline-none",
        className
      )}
      {...props}
    />
  </label>
);
