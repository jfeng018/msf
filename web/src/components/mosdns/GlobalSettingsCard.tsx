"use client";

import type { GlobalSettings } from "@/lib/mosdns-system-data";

interface GlobalSettingsCardProps {
  settings: GlobalSettings;
  onChangeSocks5: (val: string) => void;
  onChangeEcsIp: (val: string) => void;
  onChangeLogCapacity: (val: number) => void;
  onSaveLogCapacity?: () => void;
}

/* ─── SOCKS5 + ECS IP row ─── */
function SettingsInputs({
  settings,
  onChangeSocks5,
  onChangeEcsIp,
}: {
  settings: GlobalSettings;
  onChangeSocks5: (val: string) => void;
  onChangeEcsIp: (val: string) => void;
}) {
  return (
    <div className="px-4 py-2.5 rounded-lg border border-slate-200/40 bg-slate-50/30 dark:bg-slate-900/20">
      <div className="flex gap-3">
        <span className="text-lg leading-none mt-0.5">🌐</span>
        <span className="text-sm font-semibold text-foreground mt-0.5">
          全局设置
        </span>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground w-16 shrink-0">
            SOCKS5
          </label>
          <input
            type="text"
            value={settings.socks5}
            onChange={(e) => onChangeSocks5(e.target.value)}
            className="flex-1 rounded border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground w-16 shrink-0">
            ECS IP
          </label>
          <input
            type="text"
            value={settings.ecsIp}
            onChange={(e) => onChangeEcsIp(e.target.value)}
            className="flex-1 rounded border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Log capacity card ─── */
function LogCapacityCard({
  capacity,
  onChange,
  onSave,
}: {
  capacity: number;
  onChange: (val: number) => void;
  onSave?: () => void;
}) {
  return (
    <div className="px-4 py-2.5 rounded-lg border border-orange-200/60 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-900/10">
      <div className="flex gap-3">
        <span className="text-lg leading-none mt-0.5">📊</span>
        <span className="text-sm font-semibold text-foreground mt-0.5">
          日志容量
        </span>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground shrink-0">
            当前容量
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-32 rounded border border-orange-300 dark:border-orange-700 bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <button
            onClick={onSave}
            className="px-3 py-1 rounded bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 transition-colors"
          >
            设置
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 设置新容量将清空日志（最高40万）
        </p>
      </div>
    </div>
  );
}

/** Global settings section — SOCKS5, ECS IP, log capacity in a 2-col grid. */
export function GlobalSettingsCard({
  settings,
  onChangeSocks5,
  onChangeEcsIp,
  onChangeLogCapacity,
  onSaveLogCapacity,
}: GlobalSettingsCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <SettingsInputs
        settings={settings}
        onChangeSocks5={onChangeSocks5}
        onChangeEcsIp={onChangeEcsIp}
      />
      <LogCapacityCard
        capacity={settings.logCapacity}
        onChange={onChangeLogCapacity}
        onSave={onSaveLogCapacity}
      />
    </div>
  );
}
