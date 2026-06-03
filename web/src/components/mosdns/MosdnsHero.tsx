import type { LucideIcon } from "lucide-react";

export function MosdnsHero({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-gradient-to-r from-muted/30 via-muted/10 to-transparent rounded-xl border p-5 flex items-center gap-4">
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      </div>
    </div>
  );
}
