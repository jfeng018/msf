"use client";

import { RefreshCw, Square, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceAction = "start" | "stop" | "restart";

function InfoBit({ label, value }: { label: string; value: string }) {
  return (
    <div className="whitespace-nowrap">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ServiceControlCard({
  version = "-",
  cpuMem = "-",
  uptime = "-",
  pid = "-",
  running = false,
  busy = false,
  onAction,
}: {
  version?: string;
  cpuMem?: string;
  uptime?: string;
  pid?: string;
  running?: boolean;
  busy?: boolean;
  onAction?: (action: ServiceAction) => void | Promise<void>;
}) {
  const handleAction = (action: ServiceAction) => {
    void onAction?.(action);
  };

  return (
    <div className="rounded-[12px] border bg-card text-card-foreground !border-border/20 !shadow-none overflow-hidden">
      <div className="p-0">
        <div className="bg-gradient-to-r from-muted/20 to-transparent border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">服务控制</h3>
                <div
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent text-white",
                    running ? "bg-green-600 dark:bg-green-500" : "bg-gray-500"
                  )}
                >
                  {running ? "运行中" : "已停止"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <InfoBit label="版本：" value={version} />
                <InfoBit label="CPU / 内存：" value={running ? cpuMem : "-"} />
                <InfoBit label="运行时间：" value={running ? uptime : "-"} />
                <InfoBit label="PID：" value={running ? pid : "-"} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAction("restart")}
                disabled={busy || !onAction}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-[8px] px-3 shadow-sm hover:shadow transition-shadow disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} />
                重启
              </button>
              <button
                onClick={() => handleAction(running ? "stop" : "start")}
                disabled={busy || !onAction}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 text-sm font-medium h-9 rounded-[8px] px-3 shadow-sm disabled:opacity-50",
                  running
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
              >
                {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "停止" : "启动"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
