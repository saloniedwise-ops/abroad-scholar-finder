import { Search } from "lucide-react";

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const HeroSection = ({ searchQuery, onSearchChange }: HeroSectionProps) => {
  return (
    <section className="bg-hero relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-gold blur-3xl" />
        <div className="absolute bottom-10 right-20 h-48 w-48 rounded-full bg-gold-light blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 font-body text-sm font-semibold uppercase tracking-widest text-gold animate-fade-in">
            For Indian Students
          </p>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl animate-fade-up">
            Your Gateway to{" "}
            <span className="text-gradient-gold">Global Scholarships</span>
          </h1>
          <p className="mb-10 font-body text-lg text-primary-foreground/70 md:text-xl animate-fade-up" style={{ animationDelay: "0.15s" }}>
            Discover fully-funded scholarships at top universities worldwide.
            Start your journey to studying abroad today.
          </p>

          <div className="relative mx-auto max-w-xl animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scholarships, universities, or countries..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border-0 bg-card py-4 pl-12 pr-4 font-body text-card-foreground shadow-card-hover placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
