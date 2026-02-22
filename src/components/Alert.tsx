type AlertTone = "error" | "info" | "success";

const toneStyles: Record<AlertTone, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-200",
  info: "border-white/10 bg-white/5 text-white/70",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
};

type AlertProps = {
  tone?: AlertTone;
  message: string;
};

export const Alert = ({ tone = "info", message }: AlertProps) => (
  <div className={`rounded-xl border px-4 py-3 text-xs ${toneStyles[tone]}`}>
    {message}
  </div>
);
