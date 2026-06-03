"use client";

import type { RunMode, ResolutionSettings } from "@/lib/mosdns-system-data";
import { cn } from "@/lib/utils";

/* ─── Switch toggle with visible border ─── */
function SwitchToggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-emerald-500" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

interface ResolutionPolicySectionProps {
  runMode: RunMode;
  onChangeRunMode: (mode: RunMode) => void;
  resolutionSettings: ResolutionSettings;
  onToggleIpv4First: () => void;
  onToggleIpv6First: () => void;
}

export function ResolutionPolicySection({
  runMode,
  onChangeRunMode,
  resolutionSettings,
  onToggleIpv4First,
  onToggleIpv6First,
}: ResolutionPolicySectionProps) {
  return (
    <div className="rounded-[12px] border bg-card text-card-foreground !border-border/20 !shadow-none transition-shadow duration-300 hover:!shadow-sm border-blue-200/40 shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.21 235)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-tight">解析策略层</h3>
        </div>
        <p className="text-xs text-muted-foreground">决定如何解析域名</p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {/* Run mode pills */}
        <div className="flex items-start gap-4">
          <div className="flex gap-2 mt-1 shrink-0">
            <span className="text-lg leading-none">🎯</span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">运行模式</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => onChangeRunMode("compatible")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all",
                  runMode === "compatible"
                    ? "bg-blue-500 text-white shadow-md cursor-default"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:opacity-90"
                )}
              >
                🌐 兼容模式
              </button>
              <button
                onClick={() => onChangeRunMode("safe")}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all",
                  runMode === "safe"
                    ? "bg-blue-500 text-white shadow-md cursor-default"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:opacity-90"
                )}
              >
                🛡️ 安全模式
              </button>
            </div>
            <p className="text-xs text-muted-foreground">兼容/安全模式切换</p>
          </div>
        </div>

        {/* Protocol priority */}
        <div className="flex items-start gap-4 pt-2 border-t border-border/20">
          <div className="flex gap-2 mt-1 shrink-0">
            <span className="text-lg leading-none">🔀</span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">协议优先级</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-foreground bg-muted/30">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-foreground">IPV4 优先</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">Prefer IPV4（不建议开启）</p>
              </div>
              <SwitchToggle checked={resolutionSettings.ipv4First} onToggle={onToggleIpv4First} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-foreground bg-muted/30">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-foreground">IPV6 优先</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">Prefer IPV6（不建议开启）</p>
              </div>
              <SwitchToggle checked={resolutionSettings.ipv6First} onToggle={onToggleIpv6First} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-muted/50 border border-foreground">当前使用默认优先级（不设置偏好）</p>
          </div>
        </div>
      </div>
    </div>
  );
}
