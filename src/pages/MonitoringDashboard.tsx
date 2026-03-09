import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Change = {
  detected_at: string;
  university_name: string;
  change_type: string;
  change_summary: string;
  source_url: string;
};

type SourceHealth = {
  university_name: string;
  source_url: string;
  last_status: string;
};

export default function MonitoringDashboard() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [health, setHealth] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: changesData } = await supabase
      .from("v_recent_scholarship_changes")
      .select("*")
      .limit(100);

    const { data: healthData } = await supabase
      .from("v_source_health")
      .select("*");

    setChanges(changesData || []);
    setHealth(healthData || []);
    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">Scholarship Monitoring Dashboard</h1>

      {/* Changes Table */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Changes</h2>

        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">University</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{new Date(c.detected_at).toLocaleString()}</td>
                  <td className="p-2">{c.university_name}</td>
                  <td className="p-2">{c.change_type}</td>
                  <td className="p-2">{c.change_summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source Health */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Source Health</h2>

        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">University</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">URL</th>
              </tr>
            </thead>
            <tbody>
              {health.map((h, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{h.university_name}</td>
                  <td className="p-2">{h.last_status}</td>
                  <td className="p-2">
                    <a href={h.source_url} target="_blank" className="text-blue-600">
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
