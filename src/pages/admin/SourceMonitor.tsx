import { useScholarshipSources } from "@/hooks/useAdminData";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Satellite, ExternalLink } from "lucide-react";

const SourceMonitor = () => {
  const { data: sources = [], isLoading, error } = useScholarshipSources();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-xl font-bold text-foreground">Source Monitor</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <Satellite className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-body text-muted-foreground">Unable to load sources. Admin access required.</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="py-20 text-center">
            <Satellite className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-body text-muted-foreground">No sources configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source URL</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Checked</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-body text-sm text-card-foreground">{s.university_name || s.source_name}</td>
                    <td className="px-4 py-3">
                      {s.source_url ? (
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-body text-sm text-gold-dark hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {new URL(s.source_url).hostname}
                        </a>
                      ) : (
                        <span className="font-body text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-muted-foreground">
                      {s.last_checked_at ? new Date(s.last_checked_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${
                          s.last_status === "ok"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : s.last_status === "error"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.last_status || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default SourceMonitor;
