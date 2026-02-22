import { Card } from "@/components/Card";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export const StatCard = ({ label, value, helper }: StatCardProps) => (
  <Card>
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-white/50">
        {label}
      </span>
      <span className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
        {value}
      </span>
      {helper ? <span className="text-xs text-white/50">{helper}</span> : null}
    </div>
  </Card>
);
