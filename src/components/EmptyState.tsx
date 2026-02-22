import { Button } from "@/components/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => (
  <div className="rounded-3xl border border-dashed border-[var(--border)] p-8 text-center">
    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
      {title}
    </h3>
    <p className="mt-2 text-sm text-white/60">{description}</p>
    {actionLabel && onAction ? (
      <div className="mt-6 flex justify-center">
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    ) : null}
  </div>
);
