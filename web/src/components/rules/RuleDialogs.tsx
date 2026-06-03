"use client";

import { useEffect, useState } from "react";
import {
  X,
  Check,
  Pencil,
  Info,
  Upload,
  TriangleAlert,
  CheckCircle2,
} from "lucide-react";

/** Shared centered modal backdrop + card frame (matches site's rounded-3xl gradient dialog). */
function ModalShell({
  onClose,
  children,
  className = "max-w-2xl",
}: {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${className} bg-gradient-to-br from-background via-background to-muted/20 rounded-3xl border-2 border-border/50 shadow-2xl max-h-[90vh] overflow-auto animate-scale-in`}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative p-6 border-b-2 border-border/30 bg-gradient-to-r from-primary/10 via-muted/30 to-transparent overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
      <div className="relative">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
          {icon}
          {subtitle}
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border-2 border-border/50 bg-gradient-to-r from-background to-muted/20 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all shadow-sm hover:shadow-md";

const cancelCls =
  "px-6 py-3 rounded-xl border-2 border-border/50 text-foreground hover:bg-accent hover:border-border transition-all duration-200 flex items-center gap-2 font-medium";
const primaryCls =
  "px-6 py-3 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 transition-all duration-300 flex items-center gap-2 font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95";

const MODE_OPTIONS = [
  { value: "domain", label: "域匹配 domain" },
  { value: "full", label: "完整匹配 full" },
  { value: "keyword", label: "关键词 keyword" },
  { value: "regexp", label: "正则 regexp" },
];

export function AddRuleModal({
  categoryLabel,
  onClose,
  onAdd,
}: {
  categoryLabel: string;
  onClose: () => void;
  onAdd: (mode: string, value: string) => void;
}) {
  const [mode, setMode] = useState("domain");
  const [value, setValue] = useState("");

  return (
    <ModalShell onClose={onClose}>
      <DialogHeader
        title="添加规则"
        icon={<span className="text-primary">＋</span>}
        subtitle={<>添加新的 {categoryLabel} 规则</>}
      />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              匹配规则
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={inputCls}
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-2 ml-1">选择匹配方式</p>
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              规则值
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="例如: example.com"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground mt-2 ml-1">
              无需包含前缀，前缀由匹配规则选择生成
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 border-2 border-border/30 shadow-inner">
          <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            示例
          </label>
          <div className="space-y-2 text-xs text-muted-foreground font-mono">
            {[
              "domain:example.com（含子域名）",
              "full:www.example.com（仅此域名）",
              "keyword:google（包含关键字）",
              "regexp:.+\\.example\\.com$（正则）",
            ].map((ex) => (
              <div key={ex} className="px-3 py-2 rounded-lg bg-background/60">
                • {ex}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 border-t-2 border-border/30 flex justify-end gap-3 bg-gradient-to-r from-muted/20 to-transparent">
        <button onClick={onClose} className={cancelCls}>
          <X className="h-4 w-4" />取消
        </button>
        <button
          onClick={() => value.trim() && onAdd(mode, value.trim())}
          className={primaryCls}
        >
          <Check className="h-4 w-4" />添加
        </button>
      </div>
    </ModalShell>
  );
}

export function EditRuleModal({
  rule,
  onClose,
  onSave,
}: {
  rule: {
    mode: string;
    content: string;
    pattern?: string;
  };
  onClose: () => void;
  onSave: (mode: string, value: string) => void;
}) {
  const initialMode = rule.mode === "默认" ? "domain" : rule.mode;
  const [mode, setMode] = useState(initialMode);
  const [value, setValue] = useState(rule.content);
  const originalRule = rule.pattern || `${initialMode}:${rule.content}`;

  return (
    <ModalShell onClose={onClose} className="max-w-[600px]">
      <DialogHeader
        title="编辑规则"
        icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
        subtitle="修改规则内容"
      />
      <div className="p-6 space-y-5">
        <div>
          <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-muted-foreground">·</span>
            原规则
          </label>
          <input
            value={originalRule}
            readOnly
            className={`${inputCls} font-mono text-muted-foreground bg-muted/30 cursor-default`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              匹配规则
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={inputCls}
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              规则值
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>
      <div className="p-6 border-t-2 border-border/30 flex justify-end gap-3 bg-gradient-to-r from-muted/20 to-transparent">
        <button onClick={onClose} className={cancelCls}>
          <X className="h-4 w-4" />取消
        </button>
        <button
          onClick={() => value.trim() && onSave(mode, value.trim())}
          className={primaryCls}
        >
          <Check className="h-4 w-4" />保存
        </button>
      </div>
    </ModalShell>
  );
}

export function ImportRulesModal({
  categoryLabel,
  onClose,
  onImport,
}: {
  categoryLabel: string;
  onClose: () => void;
  onImport: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <ModalShell onClose={onClose}>
      <DialogHeader
        title="导入规则"
        icon={<Upload className="h-4 w-4 text-primary" />}
        subtitle={<>导入 {categoryLabel} 规则（将覆盖现有规则）</>}
      />
      <div className="p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴规则内容，每行一条规则..."
          rows={12}
          className={`${inputCls} resize-none font-mono`}
        />
      </div>
      <div className="p-6 border-t-2 border-border/30 flex justify-end gap-3 bg-gradient-to-r from-muted/20 to-transparent">
        <button onClick={onClose} className={cancelCls}>
          <X className="h-4 w-4" />取消
        </button>
        <button onClick={() => onImport(text)} className={primaryCls}>
          <Check className="h-4 w-4" />导入规则
        </button>
      </div>
    </ModalShell>
  );
}

export function ClearConfirmModal({
  categoryLabel,
  onClose,
  onConfirm,
}: {
  categoryLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onClose} className="max-w-md">
      <div className="p-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20 flex items-center justify-center">
            <TriangleAlert className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground text-center mb-2">
          清空确认
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          确定清空「{categoryLabel}」的所有规则？此操作不可恢复。
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export interface ToastItem {
  id: number;
  message: string;
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed top-20 right-4 z-[110] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-effect-strong shadow-apple-lg border border-border/30 text-sm font-medium text-foreground animate-fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
