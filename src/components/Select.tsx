import type React from "react";
import { cx } from "@/lib/classNames";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = ({ label, className, children, ...props }: SelectProps) => (
  <label className="flex flex-col gap-2 text-sm text-white/80">
    {label ? <span className="text-xs uppercase tracking-[0.2em]">{label}</span> : null}
    <select
      className={cx(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        "px-4 py-3 text-sm text-white",
        "focus:border-[var(--accent)] focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  </label>
);
