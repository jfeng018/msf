"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  RotateCw,
  Maximize2,
  Copy,
  X,
  Upload,
  Download,
  Save,
  CheckCircle2,
  FileCode,
  Cpu,
  FileText,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useToaster, ToastStack } from "@/components/Toaster";
import { YamlEditor } from "@/components/mihomo/YamlEditor";
import { api, apiList, formatBytes, formatPercent } from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_PATH = "configs/mihomo/config.yaml";

interface ConfigFile {
  name?: string;
  path?: string;
  size?: number;
  modified?: string;
}

interface ServiceStatus {
  status?: string;
  state?: string;
  running?: boolean;
  installed?: boolean;
  version?: string;
  pid?: number | string;
  uptime?: string;
  uptime_text?: string;
  cpu?: number | string;
  cpu_percent?: number | string;
  memory?: number | string;
  memory_bytes?: number | string;
  memory_text?: string;
  config_path?: string;
  path?: string;
  log_path?: string;
}

function configPathFor(file: ConfigFile | string) {
  if (typeof file === "string") {
    return file.startsWith("configs/mihomo/") ? file : `configs/mihomo/${file}`;
  }
  if (file.path) return file.path;
  return configPathFor(file.name || "config.yaml");
}

function fileName(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

function isRunning(status: ServiceStatus | null) {
  if (!status) return false;
  if (typeof status.running === "boolean") return status.running;
  const state = String(status.status || status.state || "").toLowerCase();
  return state === "running" || state === "active";
}

function serviceStatusText(status: ServiceStatus | null) {
  if (!status) return "未知";
  if (isRunning(status)) return "运行中";
  if (status.installed === false) return "未安装";
  return "已停止";
}

function memoryText(status: ServiceStatus | null) {
  if (!status) return "-";
  if (status.memory_text) return status.memory_text;
  return formatBytes(status.memory_bytes ?? status.memory);
}

function cpuText(status: ServiceStatus | null) {
  if (!status) return "-";
  return formatPercent(status.cpu_percent ?? status.cpu);
}

export default function MihomoConfigPage() {
  const { toasts, showToast } = useToaster();
  const [content, setContent] = useState("");
  const [path, setPath] = useState(DEFAULT_PATH);
  const [files, setFiles] = useState<ConfigFile[]>([]);
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [version, setVersion] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const running = isRunning(status);

  const loadStatus = useCallback(async () => {
    try {
      const [servicePayload, versionPayload] = await Promise.all([
        api<any>("/api/v1/services/mihomo"),
        api<any>("/api/v1/mihomo/version"),
      ]);
      setStatus((servicePayload.data || servicePayload.service || servicePayload) as ServiceStatus);
      setVersion(String(versionPayload.version || versionPayload.data?.version || ""));
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    }
  }, [showToast]);

  const loadFiles = useCallback(async () => {
    try {
      const payload = await api<any>("/api/v1/mihomo/configs");
      const fileRows = apiList<ConfigFile>(payload, ["files"]);
      if (fileRows.length > 0) {
        setFiles(fileRows);
        return;
      }
      const names = apiList<string>(payload, ["configs", "data"]);
      setFiles(names.map((name) => ({ name, path: configPathFor(name) })));
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    }
  }, [showToast]);

  const loadConfig = useCallback(async (nextPath = path) => {
    setLoading(true);
    try {
      const payload = await api<any>(`/api/v1/mihomo/config?path=${encodeURIComponent(nextPath)}`);
      const raw = String(payload.content ?? "");
      setPath(String(payload.path || nextPath || DEFAULT_PATH));
      setContent(raw);
      setDirty(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [path, showToast]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadConfig(path), loadFiles(), loadStatus()]);
  }, [loadConfig, loadFiles, loadStatus, path]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api("/api/v1/mihomo/config", {
        method: "PUT",
        body: JSON.stringify({ path, content }),
      });
      setDirty(false);
      showToast("配置已保存");
      await loadStatus();
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [content, loadStatus, path, showToast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const validate = useCallback(async () => {
    try {
      const payload = await api<any>("/api/v1/config/validate", {
        method: "POST",
        body: JSON.stringify({ path, content }),
      });
      if (payload.valid === false) {
        showToast(payload.error || "配置验证失败");
        return;
      }
      showToast("配置验证通过");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    }
  }, [content, path, showToast]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    showToast("配置已复制");
  }, [content, showToast]);

  const download = useCallback(() => {
    const blob = new Blob([content], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName(path);
    a.click();
    URL.revokeObjectURL(url);
    showToast("配置已下载");
  }, [content, path, showToast]);

  const upload = useCallback((file: File | null) => {
    if (!file) return;
    file.text().then((text) => {
      setContent(text);
      setDirty(true);
      showToast(`已上传 ${file.name}`);
    }).catch((err) => showToast(err instanceof Error ? err.message : String(err)));
  }, [showToast]);

  const runServiceAction = useCallback(async (action: "start" | "stop" | "restart") => {
    setActing(true);
    try {
      const payload = await api<any>(`/api/v1/services/mihomo/${action}?wait=1&timeout_ms=3000`, { method: "POST" });
      if (payload.success === false) {
        showToast(payload.error || "服务操作失败");
      } else {
        showToast(action === "restart" ? "服务已重启" : action === "start" ? "服务已启动" : "服务已停止");
      }
      await loadStatus();
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setActing(false);
    }
  }, [loadStatus, showToast]);

  const switchFile = useCallback((file: ConfigFile) => {
    if (dirty && !window.confirm("当前修改未保存，确定切换文件？")) return;
    void loadConfig(configPathFor(file));
  }, [dirty, loadConfig]);

  const serviceInfo = useMemo(() => [
    ["版本", version || status?.version || "-"],
    ["CPU / 内存", `${cpuText(status)} / ${memoryText(status)}`],
    ["运行时间", status?.uptime_text || status?.uptime || "-"],
    ["PID", String(status?.pid || "-")],
  ], [status, version]);

  return (
    <AppShell>
      <div className="space-y-4 animate-fade-in">
        <ToastStack toasts={toasts} />

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">服务控制</h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  running ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", running ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
                {serviceStatusText(status)}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => setFullscreen(true)} className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="全屏编辑" title="全屏编辑">
                <Maximize2 className="h-4 w-4" />
              </button>
              <button onClick={() => void reloadAll()} disabled={loading} className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="刷新" title="刷新">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <button
                onClick={() => void runServiceAction("restart")}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                <RotateCw className={cn("h-4 w-4", acting && "animate-spin")} />
                重启
              </button>
              <button
                onClick={() => void runServiceAction(running ? "stop" : "start")}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? "停止" : "启动"}
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {serviceInfo.map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-sm font-semibold text-foreground">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
            {path}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
            <h3 className="font-semibold text-foreground">配置文件编辑器</h3>
            {dirty && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                未保存
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={copy} disabled={!content} className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="复制配置" title="复制配置">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={() => setFullscreen(true)} className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="全屏编辑" title="全屏编辑">
                <Maximize2 className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept=".yaml,.yml,.json,.txt" className="hidden" onChange={(e) => upload(e.target.files?.[0] ?? null)} />
              <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="上传" title="上传">
                <Upload className="h-4 w-4" />
              </button>
              <button onClick={download} disabled={!content} className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="下载" title="下载">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-[460px] items-center justify-center bg-[#1e1e1e] text-sm text-[#d4d4d4]">
              正在加载配置...
            </div>
          ) : (
            <YamlEditor
              value={content}
              onChange={(value) => {
                setContent(value);
                setDirty(true);
              }}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 px-4 py-3">
            <p className="font-mono text-xs text-muted-foreground">{fileName(path)}</p>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={validate} disabled={!content} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" />
                验证配置
              </button>
              <button disabled={!dirty || saving} onClick={() => void save()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
                <Save className="h-4 w-4" />
                {saving ? "保存中" : "保存配置"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">内核版本</h3>
            </div>
            <div className="font-mono text-sm text-foreground">{version || status?.version || "-"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{serviceStatusText(status)}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">配置文件</h3>
            </div>
            <div className="space-y-1.5">
              {(files.length > 0 ? files : [{ name: "config.yaml", path: DEFAULT_PATH }]).map((file) => {
                const itemPath = configPathFor(file);
                const active = itemPath === path;
                return (
                  <button
                    key={itemPath}
                    onClick={() => switchFile(file)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left font-mono text-sm transition-colors",
                      active ? "bg-primary/10 text-primary" : "bg-muted/40 text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{file.name || fileName(itemPath)}</span>
                    {file.modified && <span className="ml-2 text-[11px] text-muted-foreground">{file.modified}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              <h3 className="font-semibold text-foreground">{fileName(path)}</h3>
              {dirty && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">未保存</span>}
              <button onClick={() => setFullscreen(false)} className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <YamlEditor
                value={content}
                maxHeight="100%"
                className="h-full"
                onChange={(value) => {
                  setContent(value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-border/50 px-4 py-3">
              <button onClick={() => setFullscreen(false)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">关闭</button>
              <button disabled={!dirty || saving} onClick={() => void save()} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {saving ? "保存中" : "保存配置"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
