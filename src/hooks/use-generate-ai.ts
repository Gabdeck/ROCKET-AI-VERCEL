import { useState, useCallback } from "react";
import { toast } from "sonner";
import { generateContent, type GenerateInput } from "@/lib/ai/generate-content.functions";

export const PLAN_EVENT = "rocketai:plan-block";
export type PlanBlockDetail = { variant: "limit" | "remix" | "no_plan" };

export function emitPlanBlock(detail: PlanBlockDetail) {
  window.dispatchEvent(new CustomEvent<PlanBlockDetail>(PLAN_EVENT, { detail }));
}

export function useGenerateAI() {
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async <T = unknown>(input: GenerateInput): Promise<T | null> => {
      setLoading(true);
      try {
        const res = await generateContent(input);
        if (!res.success) {
          if (res.code === "basic_limit_reached") {
            emitPlanBlock({ variant: "limit" });
          } else if (res.code === "premium_required") {
            emitPlanBlock({ variant: "remix" });
          } else if (res.code === "no_active_subscription") {
            emitPlanBlock({ variant: "no_plan" });
          } else {
            toast.error(res.erro);
          }
          return null;
        }
        try {
          return JSON.parse(res.dados) as T;
        } catch {
          toast.error("Não foi possível gerar agora. Tente novamente.");
          return null;
        }
      } catch (e) {
        console.error("[useGenerateAI]", e);
        const msg = e instanceof Error ? e.message : String(e);
        if (/unauthorized|no authorization|invalid token/i.test(msg)) {
          toast.error("Você precisa estar logado para usar a IA.");
        } else {
          toast.error("A IA não conseguiu responder nesse momento.");
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generate, loading };
}
