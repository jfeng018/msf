"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Unlock,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useToaster, ToastStack } from "@/components/Toaster";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
  ResetPasswordDialog,
  ROLE_LABEL,
  type User,
} from "@/components/users/UserDialogs";
import { cn } from "@/lib/utils";
import { api, apiList } from "@/lib/api";

const initialUsers: User[] = [
  {
    id: "1",
    username: "root",
    display: "root",
    email: "",
    role: "admin",
    enabled: true,
    lastLogin: "2026/06/01 21:52",
  },
];

function toUser(row: any): User {
  const last = row.last_login || row.lastLogin;
  return {
    id: String(row.id),
    username: String(row.username || ""),
    display: String(row.display_name || row.display || row.username || ""),
    email: String(row.email || ""),
    role: (row.role || "operator") as User["role"],
    enabled: Boolean(row.is_active ?? row.enabled ?? true),
    lastLogin: last ? new Date(last).toLocaleString() : "从未登录",
  };
}

const roleColors: Record<User["role"], string> = {
  admin: "bg-primary text-primary-foreground",
  operator: "bg-secondary text-secondary-foreground",
  viewer: "border border-border bg-background text-foreground",
  guest: "border border-border bg-background text-foreground",
};

const roleCards: Array<{
  role: User["role"];
  code: string;
  icon: ReactNode;
  tone: string;
  permissions: Array<{ text: string; allowed: boolean }>;
}> = [
  {
    role: "admin",
    code: "admin",
    icon: <Shield className="h-5 w-5" />,
    tone: "text-blue-500 bg-blue-500/10",
    permissions: [
      { text: "完全的系统访问权限", allowed: true },
      { text: "管理用户和权限", allowed: true },
      { text: "修改系统配置", allowed: true },
      { text: "启动/停止服务", allowed: true },
      { text: "查看和导出所有日志", allowed: true },
    ],
  },
  {
    role: "operator",
    code: "operator",
    icon: <Users className="h-5 w-5" />,
    tone: "text-purple-500 bg-purple-500/10",
    permissions: [
      { text: "管理服务(启动/停止/重启)", allowed: true },
      { text: "编辑配置文件", allowed: true },
      { text: "查看日志和监控数据", allowed: true },
      { text: "配置历史回滚", allowed: false },
      { text: "无法管理用户和系统设置", allowed: false },
    ],
  },
  {
    role: "viewer",
    code: "viewer",
    icon: <UserRound className="h-5 w-5" />,
    tone: "text-green-500 bg-green-500/10",
    permissions: [
      { text: "查看服务状态", allowed: true },
      { text: "查看配置文件(只读)", allowed: true },
      { text: "查看日志", allowed: false },
      { text: "无法修改任何配置", allowed: false },
    ],
  },
  {
    role: "guest",
    code: "guest",
    icon: <KeyRound className="h-5 w-5" />,
    tone: "text-orange-500 bg-orange-500/10",
    permissions: [
      { text: "查看基本系统信息", allowed: true },
      { text: "查看服务状态", allowed: false },
      { text: "查看部分日志", allowed: false },
      { text: "无法访问敏感配置", allowed: false },
    ],
  },
];

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-full p-3", tone)}>{icon}</div>
      </div>
    </div>
  );
}

function UserCard({
  user,
  onEdit,
  onResetPassword,
  onToggleActive,
  onDelete,
}: {
  user: User;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleActive: (id: string) => void;
  onDelete: (user: User) => void;
}) {
  const isRoot = user.id === "1";
  const initial = (user.display || user.username).slice(0, 1).toUpperCase();

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/80 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white shadow-lg">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {user.display || user.username}
              </h3>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", roleColors[user.role])}>
                {ROLE_LABEL[user.role]}
              </span>
              {isRoot ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  <Lock className="h-3 w-3" />
                  已禁用
                </span>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    user.enabled
                      ? "bg-green-600 text-white dark:bg-green-500"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {user.enabled ? "已启用" : "已禁用"}
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserRound className="h-3.5 w-3.5" />
                <span className="font-mono">@{user.username}</span>
              </div>
              {user.email && <div>{user.email}</div>}
              <div className="text-xs">最后登录: {user.lastLogin}</div>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <button
              onClick={() => onEdit(user)}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="编辑用户"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onResetPassword(user)}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="重置密码"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToggleActive(user.id)}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={user.enabled ? "禁用用户" : "启用用户"}
            >
              {user.enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onDelete(user)}
              disabled={isRoot}
              className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-destructive hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-muted-foreground"
              aria-label="删除用户"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { toasts, showToast } = useToaster();
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<User["role"] | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pageSize, setPageSize] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role !== "all") params.set("role", role);
      if (status !== "all") params.set("status", status === "active" ? "active" : "inactive");
      params.set("page_size", String(pageSize));
      const payload = await api<any>(`/api/v1/users?${params}`);
      setUsers(apiList<any>(payload, ["users", "data"]).map(toUser));
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [search, role, status, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const haystack = `${user.username} ${user.display} ${user.email}`.toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (role === "all" || user.role === role) &&
        (status === "all" || (status === "active" ? user.enabled : !user.enabled))
      );
    });
  }, [users, search, role, status]);

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.enabled).length,
    inactive: users.filter((u) => !u.enabled).length,
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-6 animate-fade-in">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-[10px] bg-gradient-to-br from-primary/10 to-secondary/10 p-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-none text-foreground">用户管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理系统用户与权限</p>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95 md:self-auto"
          >
            <Plus className="h-4 w-4" />
            创建用户
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="总用户数" value={stats.total} icon={<Users className="h-6 w-6" />} tone="bg-blue-500/10 text-blue-500" />
          <StatCard label="管理员" value={stats.admin} icon={<Shield className="h-6 w-6" />} tone="bg-purple-500/10 text-purple-500" />
          <StatCard label="活跃用户" value={stats.active} icon={<CheckCircle2 className="h-6 w-6" />} tone="bg-green-500/10 text-green-500" />
          <StatCard label="禁用用户" value={stats.inactive} icon={<XCircle className="h-6 w-6" />} tone="bg-orange-500/10 text-orange-500" />
        </div>

        <section className="rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="border-b border-border/50 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <h2 className="text-lg font-semibold text-foreground">用户管理</h2>
              <div className="ml-auto flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <div className="relative flex-1 md:min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSearch(searchDraft);
                    }}
                    placeholder="搜索用户名、邮箱或显示名称..."
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-16 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => setSearch(searchDraft)}
                    className="absolute right-1 top-1/2 h-7 -translate-y-1/2 rounded-md border border-border px-2 text-xs transition-colors hover:bg-muted"
                  >
                    搜索
                  </button>
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as User["role"] | "all")}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">所有角色</option>
                  <option value="admin">管理员</option>
                  <option value="operator">运维人员</option>
                  <option value="viewer">只读用户</option>
                  <option value="guest">访客</option>
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "all" | "active" | "inactive")}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">所有状态</option>
                  <option value="active">活跃</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              共 {filtered.length} 个用户，当前第 1 / 1 页
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">正在加载用户...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">没有匹配的用户</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filtered.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={setEditing}
                    onResetPassword={setResetting}
                    onToggleActive={(id) => {
                      const target = users.find((item) => item.id === id);
                      if (!target) return;
                      api(`/api/v1/users/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                          email: target.email,
                          display_name: target.display,
                          role: target.role,
                          is_active: !target.enabled,
                        }),
                      })
                        .then(() => {
                          showToast("用户状态已更新");
                          void loadUsers();
                        })
                        .catch((err) => showToast(err instanceof Error ? err.message : String(err)));
                    }}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 text-sm text-muted-foreground md:flex-row md:items-center">
              <div>共 {filtered.length} 个用户，当前第 1 / 1 页</div>
              <div className="flex items-center gap-2 md:ml-auto">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}/页</option>
                  ))}
                </select>
                <button disabled className="rounded-md border border-border px-3 py-1.5 opacity-50">上一页</button>
                <div className="px-2 text-xs">1 / 1</div>
                <button disabled className="rounded-md border border-border px-3 py-1.5 opacity-50">下一页</button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-foreground">角色权限说明</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {roleCards.map((card) => (
              <div key={card.role} className="rounded-lg border border-border/80 p-5 transition-all hover:border-primary hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn("rounded-lg p-2", card.tone)}>{card.icon}</div>
                  <div>
                    <div className="font-semibold text-foreground">{ROLE_LABEL[card.role]}</div>
                    <div className="mt-1">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", roleColors[card.role])}>{card.code}</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {card.permissions.map((permission) => (
                    <li key={permission.text} className="flex items-start gap-2 text-sm">
                      <span className={permission.allowed ? "text-green-500" : "text-muted-foreground"}>
                        {permission.allowed ? "✓" : "×"}
                      </span>
                      <span className={permission.allowed ? "text-foreground" : "text-muted-foreground"}>
                        {permission.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {createOpen && (
        <CreateUserDialog
          onClose={() => setCreateOpen(false)}
          onCreate={(user) => {
            api("/api/v1/users", {
              method: "POST",
              body: JSON.stringify({
                username: user.username,
                password: user.password,
                email: user.email,
                display_name: user.display,
                role: user.role,
              }),
            })
              .then(() => {
                setCreateOpen(false);
                showToast("用户已创建");
                void loadUsers();
              })
              .catch((err) => showToast(err instanceof Error ? err.message : String(err)));
          }}
        />
      )}
      {editing && (
        <EditUserDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            api(`/api/v1/users/${editing.id}`, {
              method: "PUT",
              body: JSON.stringify({
                email: patch.email ?? editing.email,
                display_name: patch.display ?? editing.display,
                role: patch.role ?? editing.role,
                is_active: editing.enabled,
              }),
            })
              .then(() => {
                setEditing(null);
                showToast("用户已保存");
                void loadUsers();
              })
              .catch((err) => showToast(err instanceof Error ? err.message : String(err)));
          }}
        />
      )}
      {resetting && (
        <ResetPasswordDialog
          user={resetting}
          onClose={() => setResetting(null)}
          onReset={(password) => {
            api(`/api/v1/users/${resetting.id}/reset-password`, {
              method: "POST",
              body: JSON.stringify({ password }),
            })
              .then(() => {
                setResetting(null);
                showToast("密码已重置");
              })
              .catch((err) => showToast(err instanceof Error ? err.message : String(err)));
          }}
        />
      )}
      {deleting && (
        <DeleteUserDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            api(`/api/v1/users/${deleting.id}`, { method: "DELETE" })
              .then(() => {
                setDeleting(null);
                showToast("用户已删除");
                void loadUsers();
              })
              .catch((err) => showToast(err instanceof Error ? err.message : String(err)));
          }}
        />
      )}
      <ToastStack toasts={toasts} />
    </AppShell>
  );
}
