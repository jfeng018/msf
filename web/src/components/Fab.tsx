"use client";

import { useState } from "react";
import { Eye, EyeOff, Maximize2, SlidersHorizontal, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  dashboardComponentOptions,
  defaultDashboardSettings,
  loadDashboardSettings,
  saveDashboardSettings,
  type DashboardSettings,
} from "@/lib/dashboard-settings";
import { cn } from "@/lib/utils";

export function Fab() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<DashboardSettings>(() => loadDashboardSettings());

  if (location.pathname !== "/") return null;

  const updateSettings = (next: DashboardSettings) => {
    setSettings(next);
    saveDashboardSettings(next);
  };

  const toggleComponent = (key: keyof DashboardSettings["visible"]) => {
    updateSettings({
      ...settings,
      visible: {
        ...settings.visible,
        [key]: !settings.visible[key],
      },
    });
  };

  const resetLayout = () => {
    updateSettings({
      compact: defaultDashboardSettings.compact,
      visible: { ...defaultDashboardSettings.visible },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="打开仪表盘设置"
        className={cn(
          "fixed bottom-6 md:bottom-6 right-4 md:right-6 z-[60] p-3 md:p-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-apple-lg hover:shadow-apple-xl transition-all select-none",
          open && "ring-4 ring-primary/30 rotate-90"
        )}
        title="仪表盘设置"
      >
        <SlidersHorizontal className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-fade-in">
          <div className="flex max-h-[82vh] w-full max-w-[400px] flex-col rounded-xl border border-border/30 bg-card text-card-foreground shadow-apple-xl">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-4">
              <h2 className="text-base font-semibold">仪表盘设置</h2>
              <button
                type="button"
                aria-label="关闭仪表盘设置"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-4 py-4">
              <section className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">显示模式</h3>
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">紧凑模式</div>
                      <div className="text-xs text-muted-foreground">
                        {settings.compact ? "已启用 - 缩小间距" : "已关闭 - 标准间距"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ ...settings, compact: !settings.compact })}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      settings.compact ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {settings.compact ? "开启" : "关闭"}
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">组件显示</h3>
                <div className="space-y-2">
                  {dashboardComponentOptions.map((item) => {
                    const visible = settings.visible[item.key];
                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleComponent(item.key)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            visible ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {visible ? "显示" : "隐藏"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-2 border-t border-border/50 pt-4">
                <h3 className="text-sm font-medium text-foreground">布局操作</h3>
                <button
                  type="button"
                  aria-label="重置仪表盘布局"
                  onClick={resetLayout}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  重置布局
                </button>
              </section>
            </div>

            <div className="border-t border-border/50 px-4 py-3 text-center text-xs text-muted-foreground">
              拖拽组件标题栏可以调整位置 · 窗口调整时自动优化布局
            </div>
          </div>
        </div>
      )}
    </>
  );
}
