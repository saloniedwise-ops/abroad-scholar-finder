import { useScholarshipChanges, useScholarshipSources } from "@/hooks/useAdminData";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function MonitoringDashboard() {
  const { data: changes = [], isLoading: loadingChanges } = useScholarshipChanges();
  const { data: sources = [], isLoading: loadingSources } = useScholarshipSources();

  const loading = loadingChanges || loadingSources;

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-xl font-bold text-foreground">Monitoring Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Recent Changes */}
        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-3">Recent Changes</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scholarship</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Field</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Old</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">New</th>
                </tr>
              </thead>
              <tbody>
                {changes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No changes recorded yet.</td></tr>
                ) : changes.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-body text-xs text-muted-foreground">{c.detected_at ? new Date(c.detected_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 font-body text-sm text-card-foreground">{c.university_name}</td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-card-foreground">{c.scholarship_name}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 font-body text-xs font-medium text-muted-foreground">{c.field_changed}</span></td>
                    <td className="px-4 py-3 font-body text-sm text-destructive line-through">{c.old_value || "—"}</td>
                    <td className="px-4 py-3 font-body text-sm text-emerald-600 dark:text-emerald-400">{c.new_value || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Source Health */}
        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-3">Source Health</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Checked</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL</th>
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center font-body text-sm text-muted-foreground">No sources configured yet.</td></tr>
                ) : sources.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-body text-sm font-medium text-card-foreground">{s.source_name}</td>
                    <td className="px-4 py-3 font-body text-sm text-card-foreground">{s.university_name || "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 font-body text-xs font-medium ${s.last_status === "ok" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{s.last_status || "unknown"}</span></td>
                    <td className="px-4 py-3 font-body text-xs text-muted-foreground">{s.last_checked_at ? new Date(s.last_checked_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">{s.source_url ? <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-primary hover:underline">Open</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}