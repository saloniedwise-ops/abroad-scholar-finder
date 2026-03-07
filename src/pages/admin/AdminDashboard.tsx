import { Link } from "react-router-dom";
import { GraduationCap, FileText, Satellite, ArrowLeft } from "lucide-react";

const AdminDashboard = () => {
  const cards = [
    {
      title: "Change Log",
      description: "Track field-level changes detected across scholarships",
      icon: <FileText className="h-6 w-6" />,
      to: "/admin/changelog",
    },
    {
      title: "Source Monitor",
      description: "Monitor scholarship source URLs and check statuses",
      icon: <Satellite className="h-6 w-6" />,
      to: "/admin/sources",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <GraduationCap className="h-6 w-6 text-gold" />
            <h1 className="font-display text-xl font-bold text-foreground">Admin Monitoring</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-1"
            >
              <div className="mb-4 text-gold">{card.icon}</div>
              <h2 className="mb-2 font-display text-lg font-bold text-card-foreground">{card.title}</h2>
              <p className="font-body text-sm text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
