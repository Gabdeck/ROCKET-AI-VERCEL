import { Link } from "@tanstack/react-router";
import { usePlan } from "@/hooks/use-plan";
import { Sparkles, AlertCircle } from "lucide-react";

export function PlanUsageIndicator({ className = "" }: { className?: string }) {
  const { plan, usage, limit, loading, hasActiveSubscription } = usePlan();
  if (loading) return null;

  if (!hasActiveSubscription) {
    return (
      <Link
        to="/configuracoes"
        hash="assinatura"
        className={`inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/15 ${className}`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        Sem assinatura ativa — escolher plano
      </Link>
    );
  }

  if (plan === "premium" || limit === null) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary ${className}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Gerações ilimitadas ativas
      </div>
    );
  }

  const remaining = Math.max(0, limit - usage);
  const danger = remaining <= 10;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        danger
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-muted-foreground"
      } ${className}`}
    >
      Você utilizou {usage} de {limit} gerações neste mês.
    </div>
  );
}
