"use client";

import type { FilterSettings } from "@/lib/mosdns-system-data";
import { cn } from "@/lib/utils";

interface FilterToggleProps {
  label: string;
  description: string;
  icon: string;
  checked: boolean;
  onToggle: () => void;
  /** Optional tooltip icon */
  tooltip?: string;
}

function FilterToggle({ label, description, icon, checked, onToggle, tooltip }: FilterToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-foreground bg-muted/30">
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-lg leading-none mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{label}</span>
            {tooltip && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {/* Toggle switch with visible border */}
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
    </div>
  );
}

interface RequestFilterSectionProps {
  filterSettings: FilterSettings;
  onToggleAdBlock: () => void;
  onToggleRequestBlock: () => void;
  onToggleTypeBlock: () => void;
  onToggleIpv6Block: () => void;
}

export function RequestFilterSection({
  filterSettings,
  onToggleAdBlock,
  onToggleRequestBlock,
  onToggleTypeBlock,
  onToggleIpv6Block,
}: RequestFilterSectionProps) {
  return (
    <div className="rounded-[12px] border bg-card text-card-foreground !border-border/20 !shadow-none transition-shadow duration-300 hover:!shadow-sm border-red-200/40 shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.15 45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-tight">请求过滤层</h3>
        </div>
        <p className="text-xs text-muted-foreground">控制哪些 DNS 请求被处理或拦截</p>
      </div>
      <div className="p-6 pt-0 space-y-1">
        {/* Ad block */}
        <FilterToggle
          icon="📛"
          label="广告屏蔽"
          description="启用 AdGuard 在线规则"
          tooltip="使用 AdGuard 规则过滤广告域名"
          checked={filterSettings.adBlock}
          onToggle={onToggleAdBlock}
        />

        {/* Request type filtering group */}
        <div className="pl-8 space-y-1 border-l-2 border-muted/60">
          <div className="text-xs text-muted-foreground font-medium pt-1 pb-1 flex items-center gap-1.5">
            <span>🚫</span> 请求类型过滤
          </div>
          <FilterToggle
            icon=""
            label="请求屏蔽"
            description="屏蔽无解析结果请求"
            tooltip=""
            checked={filterSettings.requestBlock}
            onToggle={onToggleRequestBlock}
          />
          <FilterToggle
            icon=""
            label="类型屏蔽"
            description="屏蔽 SOA/PTR/HTTPS 请求"
            tooltip=""
            checked={filterSettings.typeBlock}
            onToggle={onToggleTypeBlock}
          />
          <FilterToggle
            icon=""
            label="IPV6 屏蔽"
            description="阻止 AAAA 请求类型"
            tooltip=""
            checked={filterSettings.ipv6Block}
            onToggle={onToggleIpv6Block}
          />
        </div>
      </div>
    </div>
  );
}
