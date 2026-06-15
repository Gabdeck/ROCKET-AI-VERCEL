import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Plan = "basic" | "premium";
const BASIC_LIMIT = 100;

export interface PlanState {
  plan: Plan | null;
  usage: number;
  limit: number | null;
  loading: boolean;
  isPremium: boolean;
  isBasic: boolean;
  hasActiveSubscription: boolean;
  reachedLimit: boolean;
  refresh: () => Promise<void>;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function usePlan(): PlanState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setUsage(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: subs }, { data: usageRow }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, status, current_period_end, updated_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("user_usage")
          .select("generation_count")
          .eq("user_id", user.id)
          .eq("month", currentMonth())
          .maybeSingle(),
      ]);
      const now = Date.now();
      const valid = (subs ?? []).find((s) => {
        const end = s.current_period_end ? new Date(s.current_period_end).getTime() : null;
        return end === null || end > now;
      });
      const activePlan = (valid?.plan as Plan | undefined) ?? null;
      setPlan(activePlan === "premium" || activePlan === "basic" ? activePlan : null);
      setUsage(usageRow?.generation_count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPremium = plan === "premium";
  const isBasic = plan === "basic";
  return {
    plan,
    usage,
    limit: isPremium ? null : isBasic ? BASIC_LIMIT : 0,
    loading,
    isPremium,
    isBasic,
    hasActiveSubscription: plan !== null,
    reachedLimit: isBasic && usage >= BASIC_LIMIT,
    refresh,
  };
}
