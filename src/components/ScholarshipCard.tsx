import { GraduationCap, Calendar, MapPin, ExternalLink } from "lucide-react";
import type { Scholarship } from "@/hooks/useScholarships";

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

const ScholarshipCard = ({ scholarship }: ScholarshipCardProps) => {
  return (
    <div
      className={`group relative rounded-xl border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 ${
        scholarship.featured ? "border-gold/40" : "border-border"
      }`}
    >
      {scholarship.featured && (
        <span className="absolute -top-3 left-4 rounded-full bg-gold px-3 py-1 font-body text-xs font-semibold text-accent-foreground">
          ⭐ Featured
        </span>
      )}

      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xl">{scholarship.country_flag}</span>
            <span className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {scholarship.country_name}
            </span>
            <span className={`ml-auto rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${
              scholarship.status === "Active"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {scholarship.status}
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-card-foreground leading-tight">
            {scholarship.scholarship_name}
          </h3>
        </div>
      </div>

      <p className="mb-3 flex items-center gap-1.5 font-body text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        {scholarship.university_name}
      </p>

      <p className="mb-4 font-body text-sm leading-relaxed text-card-foreground/80 line-clamp-2">
        {scholarship.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 font-body text-xs font-medium text-muted-foreground">
          <GraduationCap className="h-3 w-3" />
          {scholarship.degree_level}
        </span>
        <span className="rounded-md bg-muted px-2.5 py-1 font-body text-xs font-medium text-muted-foreground">
          {scholarship.field_category}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="font-body text-xs text-muted-foreground">Amount</p>
          <p className="font-body text-sm font-semibold text-gold-dark">{scholarship.amount_display}</p>
        </div>
        <div className="text-right">
          <p className="font-body text-xs text-muted-foreground">Deadline</p>
          <p className="flex items-center gap-1 font-body text-sm font-medium text-card-foreground">
            <Calendar className="h-3 w-3" />
            {scholarship.deadline_display}
          </p>
        </div>
      </div>

      {scholarship.learn_more_url && scholarship.learn_more_url !== "#" && (
        <a
          href={scholarship.learn_more_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 font-body text-sm font-medium text-card-foreground transition-all hover:border-gold hover:bg-gold/10 hover:text-gold-dark"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Learn More & Apply
        </a>
      )}
    </div>
  );
};

export default ScholarshipCard;
