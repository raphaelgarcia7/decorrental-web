import type React from "react";
import { cx } from "@/lib/classNames";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-slate-900 shadow-[0_8px_20px_rgba(255,179,71,0.35)] hover:brightness-110",
  secondary: "bg-[var(--surface-2)] text-white hover:bg-[#202b3e]",
  ghost: "bg-transparent text-white/80 hover:text-white",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = ({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) => (
  <button
    className={cx(
      "rounded-full font-semibold transition",
      "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60",
      variantClasses[variant],
      sizeClasses[size],
      className
    )}
    {...props}
  />
);
