"use client";

import { Save, Globe } from "lucide-react";

interface SystemHeaderProps {
  onSave: () => void;
  saving?: boolean;
}

/** Page header card — dark gradient with title + emerald save button, matching live site exactly. */
export function SystemHeader({ onSave, saving = false }: SystemHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-50 rounded-lg border border-slate-700/60 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/10">
            <Globe className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">系统控制</h1>
            <p className="text-xs text-slate-400">上游配置、过滤策略与缓存管理</p>
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-sm font-medium text-white shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中..." : "保存并重启"}
        </button>
      </div>
    </div>
  );
}
