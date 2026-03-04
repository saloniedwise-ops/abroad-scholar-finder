import { GraduationCap, Calendar, MapPin, ArrowUpRight } from "lucide-react";
import type { Scholarship } from "@/data/scholarships";

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
            <span className="text-xl">{scholarship.countryFlag}</span>
            <span className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {scholarship.country}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-card-foreground leading-tight">
            {scholarship.name}
          </h3>
        </div>
        <a
          href={scholarship.link}
          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-gold group-hover:bg-gold group-hover:text-accent-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <p className="mb-4 flex items-center gap-1.5 font-body text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {scholarship.university}
      </p>

      <p className="mb-4 font-body text-sm leading-relaxed text-card-foreground/80 line-clamp-2">
        {scholarship.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 font-body text-xs font-medium text-muted-foreground">
          <GraduationCap className="h-3 w-3" />
          {scholarship.degree}
        </span>
        <span className="rounded-md bg-muted px-2.5 py-1 font-body text-xs font-medium text-muted-foreground">
          {scholarship.field}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="font-body text-xs text-muted-foreground">Amount</p>
          <p className="font-body text-sm font-semibold text-gold-dark">{scholarship.amount}</p>
        </div>
        <div className="text-right">
          <p className="font-body text-xs text-muted-foreground">Deadline</p>
          <p className="flex items-center gap-1 font-body text-sm font-medium text-card-foreground">
            <Calendar className="h-3 w-3" />
            {scholarship.deadline}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipCard;
