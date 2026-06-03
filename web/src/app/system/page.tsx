"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Download, RefreshCw, Stethoscope, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useToaster, ToastStack } from "@/components/Toaster";
import { api, apiData, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

type CheckStatus = "success" | "warning" | "error";
type PortStatus = "ok" | "free" | "conflict" | "unknown";
type RawRecord = Record<string, unknown>;

interface DiagnosticCheck {
  key: string;
  name: string;
  message: string;
  status: CheckStatus;
  details?: string;
}

interface PortItem {
  service: string;
  label: string;
  port: number;
  protocols: string[];
  status: PortStatus;
  tcp?: string;
  udp?: string;
  expected?: string;
  config?: string;
  notes?: string;
}

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function objectValue(source: RawRecord | undefined, keys: string[], fallback = "-") {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return fallback;
}

function detailsText(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item, null, 2))).join("\n");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function checkStatus(check: RawRecord): CheckStatus {
  const status = String(check.status || "").toLowerCase();
  if (["success", "ok", "passed", "pass", "healthy"].includes(status)) return "success";
  if (["warning", "warn"].includes(status)) return "warning";
  if (["error", "failed", "fail", "critical"].includes(status)) return "error";
  if (typeof check.ok === "boolean") return check.ok ? "success" : "error";
  return "warning";
}

function normalizeChecks(root: RawRecord): DiagnosticCheck[] {
  const rawChecks = Array.isArray(root.checks) ? root.checks : Array.isArray(root.data) ? root.data : [];
  return rawChecks
    .filter((item): item is RawRecord => Boolean(item && typeof item === "object"))
    .map((item, index) => {
      const detail = detailsText(item.details || item.raw_details || item.detail);
      return {
        key: text(item.key || item.name || index, String(index)),
        name: text(item.name || item.key, "诊断项目"),
        message: text(item.message || item.summary || item.status, "-"),
        status: checkStatus(item),
        details: detail || undefined,
      };
    });
}

function ownerText(item: RawRecord) {
  const owner = text(item.owner_process || item.owner || item.process || item.service || item.name, "");
  const pid = text(item.owner_pid || item.pid, "");
  if (owner && pid) return `${owner} (${pid})`;
  return owner || pid || "-";
}

function portStatus(item: RawRecord): PortStatus {
  const status = String(item.status || "").toLowerCase();
  if (["ok", "success", "listening", "occupied", "used"].includes(status)) return "ok";
  if (["free", "available"].includes(status)) return "free";
  if (["conflict", "error", "failed"].includes(status)) return "conflict";
  if (typeof item.ok === "boolean") return item.ok ? "ok" : "conflict";
  return "unknown";
}

function collectPortRows(root: RawRecord) {
  const candidates: unknown[] = [];
  for (const key of ["ports", "port_usage", "portUsage"]) {
    if (Array.isArray(root[key])) candidates.push(...(root[key] as unknown[]));
  }
  const checks = Array.isArray(root.checks) ? root.checks : [];
  checks
    .filter((item): item is RawRecord => Boolean(item && typeof item === "object"))
    .forEach((check) => {
      const key = String(check.key || check.name || "").toLowerCase();
      if (!key.includes("port") && !key.includes("端口")) return;
      const raw = check.raw_details || check.details;
      if (Array.isArray(raw)) candidates.push(...raw);
      if (raw && typeof raw === "object") {
        const object = raw as RawRecord;
        if (Array.isArray(object.ports)) candidates.push(...object.ports);
        if (Array.isArray(object.items)) candidates.push(...object.items);
      }
    });
  return candidates.filter((item): item is RawRecord => Boolean(item && typeof item === "object"));
}

function normalizePorts(root: RawRecord): PortItem[] {
  const grouped = new Map<string, PortItem>();
  collectPortRows(root).forEach((item) => {
    const numericPort = Number(item.port || item.listen_port || item.value);
    if (!Number.isFinite(numericPort)) return;
    const service = text(item.service || item.expected_service || item.name, "system");
    const label = text(item.label || item.description || item.role || item.name || item.service, `:${numericPort}`);
    const protocol = text(item.protocol || item.proto || item.type, "tcp").toLowerCase();
    const key = `${service}:${label}:${numericPort}`;
    const current =
      grouped.get(key) ||
      ({
        service,
        label,
        port: numericPort,
        protocols: [],
        status: portStatus(item),
        expected: text(item.expected_owner || item.expected || item.expected_service, ""),
        config: text(item.config_path_hint || item.config || item.config_path, ""),
        notes: text(item.notes || item.note || item.message, ""),
      } satisfies PortItem);
    if (!current.protocols.includes(protocol)) current.protocols.push(protocol);
    if (protocol === "udp") current.udp = ownerText(item);
    else current.tcp = ownerText(item);
    if (current.status === "unknown") current.status = portStatus(item);
    grouped.set(key, current);
  });
  return [...grouped.values()].map((port) => ({
    ...port,
    expected: port.expected || undefined,
    config: port.config || undefined,
    notes: port.notes || undefined,
  }));
}

function normalizeServiceSummary(ports: PortItem[], root: RawRecord) {
  const raw = root.service_summary || root.serviceSummary;
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is RawRecord => Boolean(item && typeof item === "object"))
      .map((item) => ({
        name: text(item.name || item.service, "service"),
        count: Number(item.count || item.total || 0),
        free: Number(item.free || item.available || 0),
      }));
  }
  const map = new Map<string, { name: string; count: number; free: number }>();
  ports.forEach((port) => {
    const current = map.get(port.service) || { name: port.service, count: 0, free: 0 };
    current.count += 1;
    if (port.status === "free") current.free += 1;
    map.set(port.service, current);
  });
  return [...map.values()];
}

function Badge({ status, children }: { status: CheckStatus | PortStatus; children: ReactNode }) {
  const classes: Record<string, string> = {
    success: "bg-green-600 text-white dark:bg-green-500",
    ok: "bg-green-600 text-white dark:bg-green-500",
    warning: "bg-yellow-500 text-white",
    unknown: "bg-yellow-500 text-white",
    error: "bg-destructive text-white",
    conflict: "bg-destructive text-white",
    free: "bg-secondary text-secondary-foreground",
  };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", classes[status])}>{children}</span>;
}

function StatTile({
  label,
  value,
  suffix,
  tone,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tone)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-foreground">
          {value}
          {suffix && <span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SystemPage() {
  const { toasts, showToast } = useToaster();
  const [diagnosing, setDiagnosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<RawRecord>({});
  const [checksOpen, setChecksOpen] = useState(true);
  const [portsOpen, setPortsOpen] = useState(true);
  const [openServices, setOpenServices] = useState<Record<string, boolean>>({});

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api("/api/v1/system/diagnostics");
      setPayload(apiData<RawRecord>(response, response as RawRecord) || {});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "诊断数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const checks = useMemo(() => normalizeChecks(payload), [payload]);
  const ports = useMemo(() => normalizePorts(payload), [payload]);
  const serviceSummary = useMemo(() => normalizeServiceSummary(ports, payload), [ports, payload]);
  const systemInfo = (payload.system || payload.info || payload.runtime || {}) as RawRecord;

  const successful = checks.filter((check) => check.status === "success").length;
  const warning = checks.filter((check) => check.status === "warning").length;
  const error = checks.filter((check) => check.status === "error").length;
  const passPercent = checks.length ? Math.round((successful / checks.length) * 100) : 0;
  const healthLabel = error > 0 ? "存在错误" : warning > 0 ? "存在警告" : checks.length > 0 ? "系统健康" : "等待诊断";

  const runDiagnostic = async () => {
    setDiagnosing(true);
    try {
      await api("/api/v1/system/diagnostics/run", { method: "POST" });
      await loadDiagnostics();
      showToast("诊断已完成");
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "重新诊断失败");
    } finally {
      setDiagnosing(false);
    }
  };

  const downloadReport = () => {
    const token = getToken();
    const url = `/api/v1/system/diagnostics/download${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.location.href = url;
  };

  return (
    <AppShell>
      <div className="space-y-4 pb-4 animate-fade-in">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">系统诊断</h1>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                error > 0
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : warning > 0
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    : "bg-green-500/10 text-green-600 dark:text-green-400"
              )}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    error > 0 ? "bg-red-500" : warning > 0 ? "bg-yellow-500" : "bg-green-500"
                  )}
                />
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", error > 0 ? "bg-red-500" : warning > 0 ? "bg-yellow-500" : "bg-green-500")} />
              </span>
              {loading ? "加载中" : healthLabel}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              onClick={downloadReport}
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              下载报告
            </button>
            <button
              onClick={runDiagnostic}
              disabled={diagnosing || loading}
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", (diagnosing || loading) && "animate-spin")} />
              {diagnosing ? "诊断中..." : "重新诊断"}
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="grid grid-cols-2 gap-3 border-b border-border/60 pb-4 md:grid-cols-4">
            <StatTile label="诊断项目" value={String(checks.length)} tone="bg-blue-500/10 text-blue-500" icon={<Stethoscope className="h-5 w-5" />} />
            <StatTile label="通过" value={String(successful)} suffix={`(${passPercent}%)`} tone="bg-green-500/10 text-green-500" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatTile label="警告" value={String(warning)} suffix={checks.length ? `(${Math.round((warning / checks.length) * 100)}%)` : "(0%)"} tone="bg-yellow-500/10 text-yellow-500" icon={<AlertCircle className="h-5 w-5" />} />
            <StatTile label="错误" value={String(error)} suffix={checks.length ? `(${Math.round((error / checks.length) * 100)}%)` : "(0%)"} tone="bg-red-500/10 text-red-500" icon={<XCircle className="h-5 w-5" />} />
          </div>
          <div className="pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">系统信息</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["操作系统", objectValue(systemInfo, ["os", "operating_system", "system", "platform"])],
                ["架构", objectValue(systemInfo, ["arch", "architecture", "goarch"])],
                ["Go 版本", objectValue(systemInfo, ["go_version", "goVersion", "go"])],
                ["CPU 核心数", objectValue(systemInfo, ["cpu_cores", "cpuCores", "cores"])],
                ["进程 PID", objectValue(systemInfo, ["pid", "process_pid"])],
                ["是否 root", objectValue(systemInfo, ["is_root", "root", "isRoot"])],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg">
          <button
            onClick={() => setChecksOpen((value) => !value)}
            className="group flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">诊断项目</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">{successful}/{checks.length}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", checksOpen && "rotate-180")} />
            </div>
          </button>
          {checksOpen && (
            <div className="grid grid-cols-1 gap-3 px-4 pb-4 animate-slide-up lg:grid-cols-2 xl:grid-cols-3">
              {checks.map((check, index) => (
                <div
                  key={check.key}
                  className="group/item rounded-lg border border-border/50 bg-gradient-to-br from-card/50 to-card p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:from-card hover:to-card/80 hover:shadow-md"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <Badge status={check.status}>{check.status === "success" ? "通过" : check.status === "warning" ? "警告" : "错误"}</Badge>
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 text-sm font-medium text-foreground transition-colors group-hover/item:text-primary">{check.name}</h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">{check.message}</p>
                      {check.details && (
                        <details className="group/details mt-2">
                          <summary className="flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80">
                            <ChevronDown className="h-3 w-3 transition-transform group-open/details:rotate-180" />
                            详情
                          </summary>
                          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border/50 bg-muted/40 p-2.5 font-mono text-xs leading-relaxed text-muted-foreground animate-fade-in">
                            {check.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && checks.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">后端没有返回诊断项目</div>}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg">
          <button
            onClick={() => setPortsOpen((value) => !value)}
            className="group flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">端口详情</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">共 {ports.length} 个端口</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", portsOpen && "rotate-180")} />
            </div>
          </button>
          {portsOpen && (
            <div className="space-y-3 px-4 pb-4 animate-slide-up">
              {serviceSummary.map((summary, index) => {
                const servicePorts = ports.filter((port) => port.service === summary.name);
                const isOpen = openServices[summary.name] !== false;
                return (
                  <div key={summary.name} className="overflow-hidden rounded-lg border border-border/50" style={{ animationDelay: `${index * 50}ms` }}>
                    <button
                      onClick={() => setOpenServices((current) => ({ ...current, [summary.name]: !isOpen }))}
                      className="group/service flex w-full items-center justify-between gap-3 bg-gradient-to-r from-muted/20 to-muted/10 px-3 py-2.5 transition-all duration-300 hover:from-muted/30 hover:to-muted/20"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground transition-colors group-hover/service:text-primary">{summary.name}</h3>
                        <Badge status="free">{summary.count}</Badge>
                        {summary.free > 0 && <Badge status="free">空闲: {summary.free}</Badge>}
                      </div>
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-1 gap-3 p-3 animate-fade-in lg:grid-cols-2 xl:grid-cols-3">
                        {servicePorts.map((port) => (
                          <div
                            key={`${port.service}-${port.port}-${port.label}`}
                            className="rounded-lg border border-border/50 bg-gradient-to-br from-card/50 to-card p-3 text-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md"
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{port.label}</span>
                              <div className="flex items-center gap-1">
                                {port.protocols.map((protocol) => (
                                  <span key={protocol} className="rounded-full border border-border px-1.5 py-0 text-xs uppercase text-muted-foreground">{protocol}</span>
                                ))}
                              </div>
                              <span className="font-mono font-bold text-primary">:{port.port}</span>
                              <Badge status={port.status}>{port.status === "ok" ? "正常" : port.status === "free" ? "空闲" : port.status === "conflict" ? "冲突" : "未知"}</Badge>
                            </div>
                            <div className="space-y-1">
                              {port.protocols.includes("tcp") && (
                                <div className="flex items-start gap-2">
                                  <span className="min-w-[35px] font-medium text-muted-foreground">TCP:</span>
                                  <span className="font-mono text-foreground">{port.tcp || "-"}</span>
                                </div>
                              )}
                              {port.protocols.includes("udp") && (
                                <div className="flex items-start gap-2">
                                  <span className="min-w-[35px] font-medium text-muted-foreground">UDP:</span>
                                  <span className="font-mono text-foreground">{port.udp || "-"}</span>
                                </div>
                              )}
                            </div>
                            {(port.expected || port.config || port.notes) && (
                              <div className="mt-2 space-y-1 rounded-lg border border-border/40 bg-muted/30 p-2 text-xs text-muted-foreground">
                                {port.expected && <div><span className="font-semibold">期望:</span> <span className="font-mono">{port.expected}</span></div>}
                                {port.config && <div className="break-all font-mono"><span className="font-semibold">配置:</span> {port.config}</div>}
                                {port.notes && <div><span className="font-semibold">备注:</span> {port.notes}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {!loading && ports.length === 0 && <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">后端没有返回端口明细</div>}
            </div>
          )}
        </section>
      </div>
      <ToastStack toasts={toasts} />
    </AppShell>
  );
}
