import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Alternar modo escuro"
      onClick={toggle}
      className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] transition hover:border-primary/40"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          isDark ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-background shadow transition-transform ${
            isDark ? "translate-x-4" : "translate-x-0.5"
          }`}
        >
          {isDark ? (
            <Moon className="h-2.5 w-2.5 text-primary" />
          ) : (
            <Sun className="h-2.5 w-2.5 text-warning" />
          )}
        </span>
      </span>
      {!compact && <span className="hidden sm:inline">Modo escuro</span>}
    </button>
  );
}
