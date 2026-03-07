import { useParams, Link } from "react-router-dom";
import { useScholarshipBySlug } from "@/hooks/useScholarships";
import { VerificationBadge } from "@/components/VerificationBadge";
import {
  GraduationCap,
  MapPin,
  Globe,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const ScholarshipDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: scholarship, isLoading, error } = useScholarshipBySlug(slug || "");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <GraduationCap className="h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold text-foreground">Scholarship not found</h1>
        <Link
          to="/"
          className="flex items-center gap-2 font-body text-sm text-gold-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all scholarships
        </Link>
      </div>
    );
  }

  const infoItems = [
    { icon: <Globe className="h-4 w-4" />, label: "Country", value: `${scholarship.country_flag} ${scholarship.country_name}` },
    { icon: <Building2 className="h-4 w-4" />, label: "University", value: scholarship.university_name },
    { icon: <BookOpen className="h-4 w-4" />, label: "Degree Level", value: scholarship.degree_level },
    { icon: <GraduationCap className="h-4 w-4" />, label: "Field", value: scholarship.field_category },
    { icon: <Calendar className="h-4 w-4" />, label: "Deadline", value: scholarship.deadline_display || "Not specified" },
    { icon: <Clock className="h-4 w-4" />, label: "Intake", value: scholarship.intake || "Not specified" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-hero px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-gold" />
            <span className="font-display text-lg font-bold text-primary-foreground">
              ScholarGlobe
            </span>
          </Link>
        </div>
      </header>

      {/* Back nav */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scholarships
        </Link>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Title section */}
          <div className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-2xl">{scholarship.country_flag}</span>
              <span className="font-body text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {scholarship.country_name}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${
                  scholarship.status === "Active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {scholarship.status}
              </span>
              {scholarship.featured && (
                <span className="rounded-full bg-gold px-3 py-0.5 font-body text-xs font-semibold text-accent-foreground">
                  ⭐ Featured
                </span>
              )}
              <VerificationBadge lastVerifiedAt={scholarship.last_verified_at} />
            </div>

            <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              {scholarship.scholarship_name}
            </h1>
            <p className="flex items-center gap-1.5 font-body text-lg text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {scholarship.university_name}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Summary */}
              {scholarship.summary && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="mb-4 font-display text-xl font-bold text-card-foreground">
                    Summary
                  </h2>
                  <p className="font-body text-sm leading-relaxed text-card-foreground/80 whitespace-pre-line">
                    {scholarship.summary}
                  </p>
                </section>
              )}

              {/* Description */}
              {scholarship.description && (
                <section className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="mb-4 font-display text-xl font-bold text-card-foreground">
                    Description
                  </h2>
                  <p className="font-body text-sm leading-relaxed text-card-foreground/80 whitespace-pre-line">
                    {scholarship.description}
                  </p>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Amount card */}
              {scholarship.amount_display && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-6 text-center">
                  <p className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Scholarship Amount
                  </p>
                  <p className="font-display text-2xl font-bold text-gold-dark">
                    {scholarship.amount_display}
                  </p>
                </div>
              )}

              {/* Info grid */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h3 className="mb-4 font-display text-lg font-bold text-card-foreground">
                  Details
                </h3>
                <div className="space-y-4">
                  {infoItems.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <span className="mt-0.5 text-muted-foreground">{item.icon}</span>
                      <div>
                        <p className="font-body text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-body text-sm font-medium text-card-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {scholarship.learn_more_url && scholarship.learn_more_url !== "#" && (
                <a
                  href={scholarship.learn_more_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 font-body text-sm font-semibold text-accent-foreground shadow-card transition-all hover:shadow-card-hover hover:brightness-105"
                >
                  <ExternalLink className="h-4 w-4" />
                  Learn More & Apply
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            © 2026 ScholarGlobe. Helping Indian students find scholarships worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ScholarshipDetail;
