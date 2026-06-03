"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw, SlidersHorizontal, ChevronDown, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useToaster, ToastStack } from "@/components/Toaster";
import { cn } from "@/lib/utils";
import { api, apiData, apiList } from "@/lib/api";

interface Rule {
  id: string;
  type: string;
  payload: string;
  count?: number;
  group: string;
  node: string;
  provider: string;
  delay?: number;
}

interface RuleProvider {
  name: string;
  type: string;
  vehicleType: string;
  updatedAt: string;
  ruleCount: number;
}

interface SelectionInfo {
  node: string;
  delay?: number;
}

const typeBadge: Record<string, string> = {
  "DST-PORT": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "DOMAIN-SUFFIX": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "DOMAIN-KEYWORD": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  DOMAIN: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "IP-CIDR": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "RULE-SET": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  GEOIP: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  MATCH: "bg-muted text-muted-foreground",
};

const typeDot: Record<string, string> = {
  "DST-PORT": "bg-cyan-500",
  "DOMAIN-SUFFIX": "bg-blue-500",
  "DOMAIN-KEYWORD": "bg-violet-500",
  DOMAIN: "bg-indigo-500",
  "IP-CIDR": "bg-amber-500",
  "RULE-SET": "bg-emerald-500",
  GEOIP: "bg-teal-500",
  MATCH: "bg-muted-foreground",
};

function stringValue(value: unknown) {
  return value == null ? "" : String(value);
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatUpdated(value: unknown) {
  const raw = stringValue(value);
  if (!raw) return "未更新";
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return raw;
  const days = Math.floor((Date.now() - time) / 86400000);
  if (days <= 0) return "今天更新";
  return `${days} 天前`;
}

function delayColor(d: number) {
  if (d < 200) return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (d < 800) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-red-500/10 text-red-600 dark:text-red-400";
}

function latestDelay(row: any) {
  const direct = numberValue(row?.delay);
  if (direct > 0) return direct;
  const history = Array.isArray(row?.history) ? row.history : [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const delay = numberValue(history[i]?.delay);
    if (delay > 0) return delay;
  }
  return 0;
}

function normalizeSelections(proxiesPayload: any): Map<string, SelectionInfo> {
  const data = apiData<any>(proxiesPayload, proxiesPayload || {});
  const groups = apiList<any>(data, ["groups", "proxy_groups"]);
  const map = new Map<string, SelectionInfo>();
  groups.forEach((group) => {
    const name = stringValue(group.name);
    if (!name) return;
    map.set(name, {
      node: stringValue(group.now || group.selected || name),
      delay: latestDelay(group) || undefined,
    });
  });
  return map;
}

function normalizeRule(row: any, index: number, selections: Map<string, SelectionInfo>): Rule {
  const group = stringValue(row.proxy || row.group || row.adapter || "-");
  const selection = selections.get(group);
  const provider = stringValue(row.provider);
  return {
    id: stringValue(row.id || row.index || index + 1),
    type: stringValue(row.type || "MATCH").toUpperCase(),
    payload: stringValue(row.payload || row.rule_payload),
    count: row.count == null ? undefined : numberValue(row.count),
    group,
    node: selection?.node || provider || group,
    provider,
    delay: selection?.delay,
  };
}

function normalizeProvider(row: any): RuleProvider {
  const runtime = row.runtime || {};
  const rules = Array.isArray(runtime.rules) ? runtime.rules : Array.isArray(row.rules) ? row.rules : [];
  return {
    name: stringValue(row.name || "-"),
    type: stringValue(row.type || row.provider_type || "rule"),
    vehicleType: stringValue(row.vehicle_type || runtime.vehicleType || row.vehicleType || "-"),
    updatedAt: formatUpdated(row.updated_at || runtime.updatedAt || runtime.updated_at),
    ruleCount: rules.length || numberValue(row.rule_count || row.count),
  };
}

export default function MihomoRulesPage() {
  const { toasts, showToast } = useToaster();
  const [tab, setTab] = useState<"rules" | "providers">("rules");
  const [query, setQuery] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [providers, setProviders] = useState<RuleProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRule, setExpandedRule] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesPayload, providersPayload, proxiesPayload] = await Promise.all([
        api<any>("/api/v1/mihomo/rules?limit=1000"),
        api<any>("/api/v1/mihomo/providers").catch(() => null),
        api<any>("/api/v1/mihomo/proxies").catch(() => null),
      ]);
      const selections = proxiesPayload ? normalizeSelections(proxiesPayload) : new Map<string, SelectionInfo>();
      const rulesData = apiData<any>(rulesPayload, rulesPayload);
      setRules(apiList<any>(rulesData, ["rules", "items", "data"]).map((row, index) => normalizeRule(row, index, selections)));
      if (providersPayload) {
        const providersData = apiData<any>(providersPayload, providersPayload);
        const ruleProviders = apiList<any>(providersData, ["rule_providers", "items", "providers"]);
        setProviders(ruleProviders.map(normalizeProvider));
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "加载规则失败");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(
      (r) =>
        r.payload.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.node.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q)
    );
  }, [query, rules]);

  return (
    <AppShell>
      <div className="space-y-4 animate-fade-in">
        <div className="relative rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-amber-400" />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-foreground">规则</h1>
              <span className="text-xs text-muted-foreground">
                总计 <span className="font-semibold text-foreground">{rules.length}</span> 条 ·{" "}
                供应商 <span className="font-semibold text-foreground">{providers.length}</span>
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => void load().then(() => showToast("已刷新规则"))}
                  className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="刷新"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </button>
                <button
                  onClick={() => searchInputRef.current?.focus()}
                  className="p-2 rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="过滤"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                <button
                  onClick={() => setTab("rules")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    tab === "rules" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  规则 ({rules.length})
                </button>
                <button
                  onClick={() => setTab("providers")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    tab === "providers" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  供应商 ({providers.length})
                </button>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索规则、策略组或供应商"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {tab === "providers" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {providers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground lg:col-span-2">
                {loading ? "正在加载规则供应商..." : "暂无规则供应商"}
              </div>
            ) : providers.map((provider) => (
              <div key={provider.name} className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{provider.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{provider.type} · {provider.vehicleType}</p>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{provider.ruleCount} 条</span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">更新于 {provider.updatedAt}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground lg:col-span-2">
                {loading ? "正在加载规则..." : "暂无规则"}
              </div>
            ) : filtered.map((r, i) => (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-card px-3 py-2.5 hover:shadow-sm hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold",
                      typeBadge[r.type] || "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", typeDot[r.type] || "bg-muted-foreground")} />
                    {r.type}
                  </span>
                  <button
                    onClick={() => setExpandedRule((current) => current === r.id ? "" : r.id)}
                    className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                    aria-label="展开"
                    aria-expanded={expandedRule === r.id}
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", expandedRule === r.id && "rotate-180")} />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  {r.count !== undefined && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {r.count}
                    </span>
                  )}
                  <span className="font-mono text-sm text-foreground truncate">
                    {r.payload || <span className="text-muted-foreground italic">final</span>}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                    {r.group}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded border border-border/60 text-foreground font-mono truncate max-w-[55%]">
                    {r.node}
                  </span>
                  {r.delay !== undefined ? (
                    <span
                      className={cn("ml-auto text-xs font-semibold px-2 py-0.5 rounded", delayColor(r.delay))}
                    >
                      {r.delay}
                    </span>
                  ) : (
                    <button
                      onClick={() => setExpandedRule((current) => current === r.id ? "" : r.id)}
                      className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
                      aria-label="策略"
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {expandedRule === r.id ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 text-xs">
                    <div className="min-w-0">
                      <div className="text-muted-foreground">规则内容</div>
                      <div className="truncate font-mono text-foreground" title={r.payload || "final"}>
                        {r.payload || "final"}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-muted-foreground">策略组</div>
                      <div className="truncate font-medium text-foreground" title={r.group}>{r.group}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-muted-foreground">当前节点</div>
                      <div className="truncate font-mono text-foreground" title={r.node}>{r.node}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-muted-foreground">供应商</div>
                      <div className="truncate font-medium text-foreground" title={r.provider || "-"}>{r.provider || "-"}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastStack toasts={toasts} />
    </AppShell>
  );
}
