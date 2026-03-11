import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Scholarship } from "@/hooks/useScholarships";

interface Props {
  scholarship: Scholarship;
  isSaved?: boolean;
  onToggleSaved?: (id: string) => void;
}

const ScholarshipCard = ({ scholarship, isSaved, onToggleSaved }: Props) => {
  const slug = scholarship.scholarship_slug || scholarship.id;

  return (
    <div className="relative rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <button
        onClick={() => onToggleSaved?.(scholarship.id)}
        className="absolute right-4 top-4"
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
          }`}
        />
      </button>

      <Link to={`/scholarship/${slug}`} className="block">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">{scholarship.country_flag}</span>
          <span className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {scholarship.country_name}
          </span>
        </div>

        <h3 className="font-display text-lg font-bold text-card-foreground leading-tight mb-1">
          {scholarship.scholarship_name}
        </h3>

        <p className="mb-3 font-body text-sm text-muted-foreground">
          {scholarship.university_name}
        </p>

        <p className="mb-4 font-body text-sm leading-relaxed text-card-foreground/80 line-clamp-2">
          {scholarship.description}
        </p>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="font-body text-xs text-muted-foreground">Amount</p>
            <p className="font-body text-sm font-semibold text-gold-dark">
              {scholarship.amount_display || "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-muted-foreground">Deadline</p>
            <p className="font-body text-sm font-medium text-card-foreground">
              {scholarship.deadline_display || "—"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ScholarshipCard;
