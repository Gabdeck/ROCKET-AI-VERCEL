import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function OptionCard({
  title,
  description,
  icon: Icon,
  selected,
  onClick,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-full w-full flex-col items-start gap-2 rounded-2xl border bg-card p-5 text-left transition-all",
        "shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      {Icon && (
        <span className="mb-1 grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="text-sm font-semibold text-foreground">{title}</span>
      {description && (
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      )}
    </button>
  );
}
