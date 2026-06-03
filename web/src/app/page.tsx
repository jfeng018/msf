import { LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-4 md:space-y-6 animate-fade-in relative">
        {/* Page title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[10px] bg-gradient-to-br from-primary/10 to-secondary/10">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-none text-foreground">
              仪表盘
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              系统概览 · 实时监控
            </p>
          </div>
        </div>

        <Dashboard />
      </div>
    </AppShell>
  );
}
