import { cx } from "@/lib/classNames";

type BadgeProps = {
  tone?: "success" | "warning" | "danger" | "neutral";
  label: string;
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
  danger: "bg-[var(--danger)]/15 text-[var(--danger)]",
  neutral: "bg-white/10 text-white/70",
};

export const Badge = ({ tone = "neutral", label }: BadgeProps) => (
  <span
    className={cx(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
      toneClasses[tone]
    )}
  >
    {label}
  </span>
);
