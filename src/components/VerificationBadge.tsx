import { ShieldCheck, AlertTriangle } from "lucide-react";

interface VerificationBadgeProps {
  lastVerifiedAt: string | null;
  compact?: boolean;
}

export function VerificationBadge({ lastVerifiedAt, compact = false }: VerificationBadgeProps) {
  if (!lastVerifiedAt) return null;

  const verifiedDate = new Date(lastVerifiedAt);
  const daysSince = Math.floor((Date.now() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSince > 30;

  const dateStr = verifiedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (compact) {
    return isStale ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-body text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <AlertTriangle className="h-2.5 w-2.5" />
        {daysSince}d ago
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-body text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <ShieldCheck className="h-2.5 w-2.5" />
        Verified
      </span>
    );
  }

  return isStale ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-body text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <AlertTriangle className="h-3 w-3" />
      Last verified {dateStr} ({daysSince}d ago)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-body text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <ShieldCheck className="h-3 w-3" />
      Verified {dateStr}
    </span>
  );
}
