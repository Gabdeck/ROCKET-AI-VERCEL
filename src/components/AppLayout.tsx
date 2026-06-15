import { Link, useNavigate } from "@tanstack/react-router";
import { Rocket, Wand2, FolderOpen, Settings, Menu, X, LogOut, Sparkles, Briefcase } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlanUsageIndicator } from "@/components/PlanUsageIndicator";
import { PremiumModal } from "@/components/PremiumModal";
import { PLAN_EVENT, type PlanBlockDetail } from "@/hooks/use-generate-ai";


const nav = [
  { to: "/gerador", label: "Gerador", icon: Wand2 },
  { to: "/remix", label: "Remix", icon: Sparkles },
  { to: "/meus-conteudos", label: "Meus conteúdos", icon: FolderOpen },
  { to: "/meu-negocio", label: "Meu Negócio", icon: Briefcase },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName =
    (user?.user_metadata as { nome?: string } | undefined)?.nome ||
    user?.email?.split("@")[0] ||
    "";
  const [planModal, setPlanModal] = useState<null | PlanBlockDetail["variant"]>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PlanBlockDetail>).detail;
      setPlanModal(detail?.variant ?? "limit");
    };
    window.addEventListener(PLAN_EVENT, handler);
    return () => window.removeEventListener(PLAN_EVENT, handler);
  }, []);

  async function handleSignOut() {
    await signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]">
              <Rocket className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              <span className="text-foreground">Rocket</span>
              <span className="text-primary">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && <PlanUsageIndicator className="hidden lg:inline-flex" />}
            <ThemeToggle />
            {user && (

              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">{displayName}</span>
                <button
                  onClick={handleSignOut}
                  className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/40 sm:inline-flex"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              </>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground")}
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground"
                >
                  <LogOut className="h-4 w-4" /> Sair ({displayName})
                </button>
              )}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-muted-foreground sm:px-6">
        RocketAI · Crie conteúdo sem trava criativa
      </footer>
      <PremiumModal
        open={planModal !== null}
        onOpenChange={(v) => !v && setPlanModal(null)}
        variant={planModal ?? "limit"}
      />
    </div>
  );
}
