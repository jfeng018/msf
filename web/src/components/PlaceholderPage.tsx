"use client";

import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export function PlaceholderPage({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <AppShell>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 md:py-4 bg-gradient-to-r from-muted/30 via-muted/10 to-transparent rounded-xl border border-border/50 shadow-sm mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">
                {title}
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            功能开发中
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            该功能模块正在开发中，敬请期待。如需配置，请通过配置文件手动修改。
          </p>
        </div>
      </div>
    </AppShell>
  );
}
