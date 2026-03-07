import { useScholarshipChanges } from "@/hooks/useAdminData";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, FileText } from "lucide-react";

const ChangeLog = () => {
  const { data: changes = [], isLoading } = useScholarshipChanges();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-xl font-bold text-foreground">Change Log</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : changes.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-body text-muted-foreground">No changes recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scholarship</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Field Changed</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Old Value</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Value</th>
                  <th className="px-4 py-3 text-left font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detected At</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-body text-sm text-card-foreground">{c.university_name}</td>
                    <td className="px-4 py-3 font-body text-sm font-medium text-card-foreground">{c.scholarship_name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-body text-xs font-medium text-muted-foreground">
                        {c.field_changed}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-destructive line-through">{c.old_value || "—"}</td>
                    <td className="px-4 py-3 font-body text-sm text-emerald-600 dark:text-emerald-400">{c.new_value || "—"}</td>
                    <td className="px-4 py-3 font-body text-xs text-muted-foreground">
                      {new Date(c.detected_at).toLocaleString()}
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

export default ChangeLog;
