import Link from "next/link";
import { useState } from "react";
import {
  Server,
  Cpu,
  MemoryStick,
  RefreshCw,
  Square,
  ChartColumn,
  List,
  Search,
  Wrench,
  Settings,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ToastStack, useToaster } from "@/components/Toaster";
import { api, apiData, formatBytes, formatPercent } from "@/lib/api";
import { useApiPath } from "@/lib/use-api";

interface ModuleCard {
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
  href: string;
}

const modules: ModuleCard[] = [
  { icon: ChartColumn, color: "blue", title: "概述", desc: "查看 MosDNS 服务的关键指标和详细统计", href: "/mosdns/overview" },
  { icon: List, color: "orange", title: "规则管理", desc: "管理 DNS 分流规则和黑白名单", href: "/mosdns/rules" },
  { icon: Server, color: "teal", title: "客户端设置", desc: "管理客户端代理权限，支持白名单和黑名单", href: "/mosdns/clients" },
  { icon: Search, color: "pink", title: "DNS 日志", desc: "查询和分析 DNS 请求日志", href: "/mosdns/query-log" },
  { icon: Wrench, color: "cyan", title: "系统功能", desc: "系统功能和高级设置", href: "/mosdns/system" },
  { icon: Settings, color: "green", title: "配置管理", desc: "管理配置文件和版本", href: "/mosdns/service-config" },
  { icon: FileText, color: "purple", title: "实时日志", desc: "查看实时运行日志和历史记录", href: "/mosdns/logs" },
];

const colorMap: Record<string, { overlay: string; tile: string; text: string }> = {
  blue: { overlay: "from-blue-500/20 to-blue-500/5", tile: "from-blue-500/20 to-blue-500/5", text: "text-blue-500" },
  orange: { overlay: "from-orange-500/20 to-orange-500/5", tile: "from-orange-500/20 to-orange-500/5", text: "text-orange-500" },
  teal: { overlay: "from-teal-500/20 to-teal-500/5", tile: "from-teal-500/20 to-teal-500/5", text: "text-teal-500" },
  pink: { overlay: "from-pink-500/20 to-pink-500/5", tile: "from-pink-500/20 to-pink-500/5", text: "text-pink-500" },
  cyan: { overlay: "from-cyan-500/20 to-cyan-500/5", tile: "from-cyan-500/20 to-cyan-500/5", text: "text-cyan-500" },
  green: { overlay: "from-green-500/20 to-green-500/5", tile: "from-green-500/20 to-green-500/5", text: "text-green-500" },
  purple: { overlay: "from-purple-500/20 to-purple-500/5", tile: "from-purple-500/20 to-purple-500/5", text: "text-purple-500" },
};

function InfoBit({ label, value }: { label: string; value: string }) {
  return (
    <div className="whitespace-nowrap">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function MosdnsPage() {
  const { toasts, showToast } = useToaster();
  const [busy, setBusy] = useState("");
  const statusQuery = useApiPath<any>("/api/v1/mosdns/status", [], 3000);
  const status = apiData<any>(statusQuery.data, {});
  const running = Boolean(status.running || status.status === "running");
  const version = String(status.version || "-");

  const runAction = async (action: "start" | "stop" | "restart") => {
    setBusy(action);
    try {
      const payload = await api<any>(`/api/v1/services/mosdns/${action}?wait=1&timeout=5`, { method: "POST" });
      if (payload.success === false) throw new Error(payload.error || "服务操作失败");
      showToast("服务操作完成");
      void statusQuery.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <ToastStack toasts={toasts} />
        {/* Hero */}
        <div className="bg-gradient-to-r from-muted/30 via-muted/10 to-transparent rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10">
              <Server className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                MosDNS 管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                DNS 服务管理与配置
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold ring-1 ring-primary/30">
                  {version}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={(running ? "bg-green-500 animate-pulse" : "bg-gray-400") + " h-3 w-3 rounded-full"} />
            <span className="text-sm font-medium text-muted-foreground">{running ? "运行中" : "已停止"}</span>
          </div>
        </div>

        {/* Service control */}
        <div className="rounded-[12px] border bg-card text-card-foreground !border-border/20 !shadow-none overflow-hidden">
          <div className="p-0">
            <div className="bg-gradient-to-r from-muted/20 to-transparent border-b px-5 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">服务控制</h3>
                    <div className={(running ? "bg-green-600 dark:bg-green-500" : "bg-gray-500") + " inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent text-white"}>
                      {running ? "运行中" : "已停止"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <InfoBit label="版本：" value={version} />
                    <InfoBit label="CPU / 内存：" value={`${formatPercent(status.cpu ?? status.cpu_percent)} / ${typeof status.memory === "string" ? status.memory : formatBytes(status.memory)}`} />
                    <InfoBit label="运行时间：" value={String(status.uptime || "-")} />
                    <InfoBit label="PID：" value={String(status.pid || "-")} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void runAction("restart")} disabled={!!busy} className="inline-flex items-center justify-center gap-1.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-[8px] px-3 shadow-sm hover:shadow transition-shadow disabled:opacity-50">
                    <RefreshCw className={"h-4 w-4 " + (busy === "restart" ? "animate-spin" : "")} />
                    重启
                  </button>
                  <button onClick={() => void runAction(running ? "stop" : "start")} disabled={!!busy} className="inline-flex items-center justify-center gap-1.5 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 rounded-[8px] px-3 shadow-sm disabled:opacity-50">
                    <Square className="h-4 w-4" />
                    {running ? "停止" : "启动"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Runtime stats */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-5 border border-primary/20">
          <h3 className="text-lg font-semibold text-foreground mb-4">运行统计</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-card rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Cpu className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">CPU 使用率</p>
                  <p className="text-2xl font-bold text-foreground">{formatPercent(status.cpu ?? status.cpu_percent)}</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${Math.min(Number(status.cpu ?? status.cpu_percent ?? 0), 100)}%` }} />
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MemoryStick className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">内存使用率</p>
                  <p className="text-2xl font-bold text-foreground">{typeof status.memory === "string" ? status.memory : formatBytes(status.memory)}</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: "13%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Function modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">功能模块</h2>
            <span className="text-sm text-muted-foreground">选择一个模块开始管理</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => {
              const Icon = m.icon;
              const c = colorMap[m.color];
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group relative bg-card rounded-xl border p-6 text-left transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
                >
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${c.overlay} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg bg-gradient-to-br ${c.tile} border border-current/20`}
                      >
                        <Icon className={`h-6 w-6 ${c.text}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
