import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const ScholarshipDetail = lazy(() => import("./pages/ScholarshipDetail"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ChangeLog = lazy(() => import("./pages/admin/ChangeLog"));
const SourceMonitor = lazy(() => import("./pages/admin/SourceMonitor"));
const MonitoringDashboard = lazy(() => import("./pages/MonitoringDashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" /></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scholarship/:slug" element={<ScholarshipDetail />} />
            <Route path="/monitoring" element={<MonitoringDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/changelog" element={<ChangeLog />} />
            <Route path="/admin/sources" element={<SourceMonitor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
