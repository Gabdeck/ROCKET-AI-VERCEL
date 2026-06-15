import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  variant?: "remix" | "limit" | "no_plan";
}

export function PremiumModal({ open, onOpenChange, variant = "remix" }: Props) {
  const navigate = useNavigate();

  const config = {
    remix: {
      tag: "Recurso Premium",
      title: "Desbloqueie o Remix Inteligente",
      desc: "O Remix Inteligente faz parte do RocketAI Premium. Faça upgrade para adaptar conteúdos virais para o seu nicho sem limitações.",
      cancel: "Continuar no Basic",
      cta: "Ver Premium",
    },
    limit: {
      tag: "Limite mensal atingido",
      title: "Você usou as 100 gerações do mês",
      desc: "Você utilizou as 100 gerações disponíveis do plano Basic neste mês. Faça upgrade para o RocketAI Premium e tenha gerações ilimitadas.",
      cancel: "Fechar",
      cta: "Conhecer o Premium",
    },
    no_plan: {
      tag: "Assinatura necessária",
      title: "Escolha um plano para continuar",
      desc: "Para usar a RocketAI você precisa de uma assinatura ativa. Escolha entre Basic ou Premium para liberar as gerações.",
      cancel: "Fechar",
      cta: "Ver planos",
    },
  }[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {config.tag}
          </div>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription className="pt-2">{config.desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:flex-1">
            {config.cancel}
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/configuracoes", hash: "assinatura" });
            }}
            className="sm:flex-1"
          >
            {config.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
