import {
  GraduationCap,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  Clock3,
  Banknote,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Scholarship } from "@/hooks/useScholarships";
import { daysUntil, deadlineLabel, getDeadlineDate } from "@/lib/deadline";
import { VerificationBadge } from "@/components/VerificationBadge";

interface ScholarshipCardProps {
  scholarship: Scholarship;
  isSaved?: boolean;
  onToggleSaved?: (id: string) => void;
  matchReasons?: string[];
}


const isRecentlyUpdated = (lastVerifiedAt?: string | null) => {
  if (!lastVerifiedAt) return false;
  const parsed = new Date(lastVerifiedAt);
  if (isNaN(parsed.getTime())) return false;

  const now = new Date();
  const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
};

const isHighValueScholarship = (amount?: string | null) => {
  if (!amount) return false;
  const text = amount.toLowerCase();

  return (
    text.includes("full tuition") ||
    text.includes("fully funded") ||
    text.includes("100%") ||
    text.includes("tuition waiver") ||
    text.includes("living stipend")
  );
};

const getDeadlineBadge = (scholarship: Scholarship) => {
  const daysUntilDeadline = daysUntil(getDeadlineDate(scholarship));

  if (daysUntilDeadline === null) return null;
  if (daysUntilDeadline < 0) return null;
  if (daysUntilDeadline <= 7) return { label: `Closes in ${daysUntilDeadline}d`, urgent: true };
  if (daysUntilDeadline <= 14) return { label: "Closing Soon", urgent: false };

  return null;
};

const ScholarshipCard = ({
  scholarship,
  isSaved = false,
  onToggleSaved,
  matchReasons,
}: ScholarshipCardProps) => {
  const slug = scholarship.scholarship_slug || scholarship.id;
  const deadlineBadge = getDeadlineBadge(scholarship);
  const showUpdatedBadge = isRecentlyUpdated(scholarship.last_verified_at);
  const showHighValueBadge = isHighValueScholarship(scholarship.amount_display);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 overflow-hidden">
      <button
        onClick={() => onToggleSaved?.(scholarship.id)}
        className={`absolute right-4 top-4 z-20 inline-flex items-center justify-center rounded-full border p-2 transition-colors ${
          isSaved
            ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
            : "border-border bg-background text-muted-foreground hover:border-rose-200 hover:text-rose-500"
        }`}
        aria-label={isSaved ? "Remove from saved" : "Save scholarship"}
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      </button>

      <div className="flex flex-wrap gap-1.5 px-5 pt-5">
        {scholarship.featured && (
          <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-body text-[11px] font-semibold text-gold-dark">
            ⭐ Featured
          </span>
        )}

        {deadlineBadge && (
          <span className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold ${deadlineBadge.urgent ? "bg-destructive/15 text-destructive" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
            {deadlineBadge.label}
          </span>
        )}

        {showUpdatedBadge && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-body text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Updated
            </span>
          </span>
        )}

        {showHighValueBadge && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-body text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <span className="inline-flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              High Value
            </span>
          </span>
        )}
      </div>

      <Link to={`/scholarship/${slug}`} className="flex flex-1 flex-col p-5 pt-3">
        <div className="mb-3">
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{scholarship.country_flag}</span>
              <span className="font-body text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {scholarship.country_name}
              </span>
              <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 font-body text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {scholarship.status}
              </span>
            </div>
          </div>

          <h3 className="font-display text-lg font-bold leading-tight text-card-foreground">
            {scholarship.scholarship_name}
          </h3>

          {matchReasons && matchReasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matchReasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-gold/15 px-2 py-0.5 font-body text-[11px] font-medium text-gold-dark"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mb-2 flex items-center gap-1.5 font-body text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {scholarship.university_name}
        </p>

        <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-card-foreground/70 line-clamp-2">
          {scholarship.description ||
            scholarship.summary ||
            "Scholarship details available on the official university page."}
        </p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-body text-[11px] font-medium text-muted-foreground">
            <GraduationCap className="h-3 w-3" />
            {scholarship.degree_level || "Open"}
          </span>

          <span className="rounded-full bg-muted px-2.5 py-1 font-body text-[11px] font-medium text-muted-foreground">
            {scholarship.field_category || "All Fields"}
          </span>

          <VerificationBadge lastVerifiedAt={scholarship.last_verified_at} compact />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p className="font-body text-sm font-semibold text-gold-dark">
              {scholarship.amount_display || "Check official page"}
            </p>
          </div>

          <div className="text-right">
            <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">
              Deadline
            </p>
            <p className="flex items-center gap-1 font-body text-sm font-medium text-card-foreground">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {deadlineLabel(scholarship)}
            </p>
          </div>
        </div>

        {scholarship.last_verified_at && (
          <p className="mt-3 font-body text-[10px] text-muted-foreground">
            <Clock3 className="mr-1 inline h-3 w-3" />
            Source page checked {new Date(scholarship.last_verified_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
        )}
      </Link>

      {scholarship.learn_more_url && scholarship.learn_more_url !== "#" && (
        <a
          href={scholarship.learn_more_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border-t border-border bg-muted/30 px-5 py-3 font-body text-sm font-medium text-primary transition-colors hover:bg-muted/60"
        >
          <ExternalLink className="h-4 w-4" />
          Learn More & Apply
        </a>
      )}
    </div>
  );
};

export default ScholarshipCard;
