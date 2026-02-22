import type React from "react";
import { cx } from "@/lib/classNames";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "highlight";
};

export const Card = ({ className, tone = "default", ...props }: CardProps) => (
  <div
    className={cx(
      "rounded-3xl border border-[var(--border)]",
      tone === "highlight"
        ? "bg-gradient-to-br from-[#1b2636] via-[#141f30] to-[#0e1725]"
        : "bg-[var(--surface)]",
      "p-6 shadow-[0_20px_40px_rgba(0,0,0,0.25)]",
      className
    )}
    {...props}
  />
);
