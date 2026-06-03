import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  MonitorCog,
  Network,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NetworkInterface {
  name: string;
  ip?: string;
  primary_ip?: string;
  is_loopback?: boolean;
  is_up?: boolean;
}

const defaultForm = {
  username: "root",
  password: "",
  confirmPassword: "",
  email: "",
  webPort: "7777",
  selected_interface: "",
  mihomo_core_type: "meta",
  amd64v3_enabled: false,
  auto_set_dns: true,
  dns_on: "127.0.0.1",
  dns_off: "223.5.5.5",
  enableIPv6: true,
  fakeIPRangeV4: "28.0.0.0/8",
  fakeIPRangeV6: "f2b0::/18",
  linux_proxy_mode: "nft",
  nft_proxy_policy: "direct_default",
  proxyCore: "mihomo",
  mosdnsEnabled: true,
  subscription_urls: "",
  mihomo_proxies: "",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SetupPage() {
  const navigate = useNavigate();
  const { initialized, user, loading, refresh } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [ifaces, setIfaces] = useState<NetworkInterface[]>([]);
  const [system, setSystem] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && initialized) {
      navigate(user ? "/" : "/login", { replace: true });
    }
  }, [loading, initialized, user, navigate]);

  useEffect(() => {
    Promise.all([
      api<any>("/api/v1/setup/system-info", { skipAuth: true }),
      api<any>("/api/v1/setup/network-interfaces", { skipAuth: true }),
    ])
      .then(([sys, net]) => {
        const rows = net.interfaces || net.data || [];
        setSystem(sys);
        setIfaces(rows);
        const first = rows.find((item: NetworkInterface) => item.is_up && !item.is_loopback) || rows[0];
        if (first?.name) {
          setForm((current) => ({ ...current, selected_interface: first.name }));
        }
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : String(err)));
  }, []);

  const selectedInterface = useMemo(
    () => ifaces.find((item) => item.name === form.selected_interface),
    [ifaces, form.selected_interface]
  );

  const update = (key: keyof typeof defaultForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!form.password || form.password !== form.confirmPassword) {
      setMessage("请填写一致的管理员密码");
      return;
    }
    setBusy(true);
    try {
      await api("/api/v1/setup/initialize", {
        method: "POST",
        body: JSON.stringify(form),
        skipAuth: true,
      });
      await refresh();
      navigate("/login", { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4 py-8 text-foreground dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-border/70 bg-card/90 p-8 shadow-apple-lg backdrop-blur">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MonitorCog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">初始化 MSM</h1>
              <p className="mt-1 text-sm text-muted-foreground">创建管理员并生成基础服务配置</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { icon: UserRound, title: "管理员账号", desc: "用于登录 Web 控制台" },
              { icon: Network, title: "网络接口", desc: "用于 DNS 与透明代理配置" },
              { icon: ShieldCheck, title: "服务配置", desc: "默认启用 MosDNS 与 Mihomo" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 rounded-xl border bg-background/70 p-4">
                <Icon className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              系统检测
            </div>
            <div className="mt-3 grid gap-2">
              <div>平台：{system?.system?.os || "-"} / {system?.system?.arch || "-"}</div>
              <div>主机：{system?.system?.hostname || "-"}</div>
              <div>CPU：{system?.cpu?.model || "-"} · {system?.cpu?.cores || "-"} 核</div>
              <div>接口：{selectedInterface?.name || "-"} {selectedInterface?.primary_ip || selectedInterface?.ip || ""}</div>
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-apple-lg backdrop-blur md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="用户名">
              <input value={form.username} onChange={(e) => update("username", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
            <Field label="邮箱">
              <input value={form.email} onChange={(e) => update("email", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
            <Field label="密码">
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
            <Field label="确认密码">
              <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
            <Field label="Web 端口">
              <input value={form.webPort} onChange={(e) => update("webPort", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
            <Field label="网络接口">
              <select value={form.selected_interface} onChange={(e) => update("selected_interface", e.target.value)} className="rounded-xl border bg-background px-3 py-2">
                {ifaces.map((iface) => (
                  <option key={iface.name} value={iface.name}>
                    {iface.name} {iface.primary_ip || iface.ip || ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fake-IP IPv4">
              <input value={form.fakeIPRangeV4} onChange={(e) => update("fakeIPRangeV4", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
            <Field label="Fake-IP IPv6">
              <input value={form.fakeIPRangeV6} onChange={(e) => update("fakeIPRangeV6", e.target.value)} className="rounded-xl border bg-background px-3 py-2" />
            </Field>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["auto_set_dns", "自动设置 DNS"],
              ["enableIPv6", "启用 IPv6"],
              ["mosdnsEnabled", "启用 MosDNS"],
              ["amd64v3_enabled", "AMD64 v3 优化"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border bg-background/70 px-4 py-3 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[key as keyof typeof form])}
                  onChange={(event) => update(key as keyof typeof defaultForm, event.target.checked)}
                  className="h-4 w-4"
                />
              </label>
            ))}
          </div>

          <Field label="订阅链接">
            <textarea value={form.subscription_urls} onChange={(e) => update("subscription_urls", e.target.value)} className="min-h-24 rounded-xl border bg-background px-3 py-2" placeholder="一行一个订阅地址" />
          </Field>

          {message && (
            <div className={cn("mt-4 rounded-xl border px-4 py-3 text-sm", message.includes("成功") ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-red-500/40 bg-red-500/10 text-red-700")}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            创建并初始化
          </button>
        </form>
      </div>
    </div>
  );
}
