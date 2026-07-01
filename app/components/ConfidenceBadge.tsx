import type { Confidence } from "@/app/lib/types";

const STYLES: Record<Confidence, string> = {
  low: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STYLES[confidence]}`}
    >
      {confidence} confidence
    </span>
  );
}
