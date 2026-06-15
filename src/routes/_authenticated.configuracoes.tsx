import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  User as UserIcon,
  Palette,
  Bell,
  Shield,
  Lock,
  CreditCard,
  Info,
  LogOut,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Download,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — RocketAI" }] }),
  component: Configuracoes,
});

type Tema = "claro" | "escuro" | "auto";
const PREF_KEY = "rocketai:preferencias";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyTema(t: Tema) {
  const root = document.documentElement;
  const isDark =
    t === "escuro" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function Configuracoes() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tema, setTema] = useState<Tema>("claro");
  const [notif, setNotif] = useState({ lembretes: true, novidades: true, dicas: false });

  const [pwdOpen, setPwdOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setNome((user.user_metadata as { nome?: string } | undefined)?.nome ?? "");
      setEmail(user.email ?? "");
    }
    const p = loadPrefs();
    if (p) {
      if (p.tema) setTema(p.tema);
      if (p.notif) setNotif(p.notif);
    }
  }, [user]);

  useEffect(() => {
    applyTema(tema);
  }, [tema]);

  function savePrefs(patch: object) {
    const current = loadPrefs() ?? {};
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...current, ...patch }));
  }

  async function salvarConta() {
    const { error } = await supabase.auth.updateUser({ data: { nome } });
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Informações da conta atualizadas.");
  }

  function trocarTema(t: Tema) {
    setTema(t);
    savePrefs({ tema: t });
    toast.success("Preferência de aparência salva.");
  }

  function toggleNotif(k: keyof typeof notif) {
    const next = { ...notif, [k]: !notif[k] };
    setNotif(next);
    savePrefs({ notif: next });
    toast.success("Preferência salva.");
  }

  async function handleSignOutAll() {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Sessões encerradas.");
    navigate({ to: "/auth" });
  }

  async function handleLogout() {
    await signOut();
    toast.success("Você saiu da sua conta.");
    navigate({ to: "/auth" });
  }

  function baixarDados() {
    toast.success("Preparando seus dados para download.");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie sua conta, segurança, aparência e preferências do aplicativo.
        </p>

        <div className="mt-8 space-y-5">
          {/* Conta */}
          <Card icon={<UserIcon className="h-4 w-4" />} title="Conta">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInline label="Nome" value={nome} onChange={setNome} />
              <FieldInline label="Email" value={email} onChange={() => {}} disabled />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={salvarConta} className="rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)]">
                Salvar alterações
              </button>
              <button onClick={() => setPwdOpen(true)} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
                Alterar senha
              </button>
            </div>
          </Card>

          {/* Aparência */}
          <Card icon={<Palette className="h-4 w-4" />} title="Aparência">
            <p className="mb-3 text-sm text-muted-foreground">Tema do aplicativo</p>
            <div className="flex flex-wrap gap-2">
              <ThemeBtn active={tema === "claro"} onClick={() => trocarTema("claro")} icon={<Sun className="h-4 w-4" />} label="Claro" />
              <ThemeBtn active={tema === "escuro"} onClick={() => trocarTema("escuro")} icon={<Moon className="h-4 w-4" />} label="Escuro" />
              <ThemeBtn active={tema === "auto"} onClick={() => trocarTema("auto")} icon={<Monitor className="h-4 w-4" />} label="Automático" />
            </div>
          </Card>

          {/* Notificações */}
          <Card icon={<Bell className="h-4 w-4" />} title="Notificações">
            <Toggle
              label="Lembretes de postagem"
              description="Receba lembretes para produzir e publicar seus conteúdos."
              checked={notif.lembretes}
              onChange={() => toggleNotif("lembretes")}
            />
            <Toggle
              label="Novidades do app"
              description="Receba avisos sobre novos recursos e melhorias."
              checked={notif.novidades}
              onChange={() => toggleNotif("novidades")}
            />
            <Toggle
              label="Dicas de conteúdo"
              description="Receba sugestões para melhorar sua rotina de postagens."
              checked={notif.dicas}
              onChange={() => toggleNotif("dicas")}
            />
          </Card>

          {/* Segurança */}
          <Card icon={<Shield className="h-4 w-4" />} title="Segurança">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPwdOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
                <Lock className="h-4 w-4" /> Alterar senha
              </button>
              <button onClick={() => setSignOutOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
                <LogOut className="h-4 w-4" /> Encerrar sessões
              </button>
            </div>
          </Card>

          {/* Privacidade */}
          <Card icon={<Shield className="h-4 w-4" />} title="Privacidade">
            <p className="text-sm text-muted-foreground">
              Seus dados de conteúdo são usados apenas para personalizar sua experiência dentro do RocketAI.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={baixarDados} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
                <Download className="h-4 w-4" /> Baixar meus dados
              </button>
              <button onClick={() => setDelOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Excluir minha conta
              </button>
            </div>
          </Card>

          {/* Assinatura */}
          <SubscriptionCard />


          {/* Sobre */}
          <Card icon={<Info className="h-4 w-4" />} title="Sobre o RocketAI">
            <div className="space-y-1 text-sm">
              <div className="text-muted-foreground">Versão do app: <span className="text-foreground">1.0.0</span></div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
                <a className="text-primary hover:underline" href="#">Termos de uso</a>
                <a className="text-primary hover:underline" href="#">Política de privacidade</a>
                <a className="text-primary hover:underline" href="#">Suporte</a>
              </div>
            </div>
          </Card>

          <div className="pt-2">
            <button onClick={handleLogout} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:border-destructive/40 hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
          </div>
        </div>
      </div>

      {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} />}
      {signOutOpen && (
        <ConfirmModal
          title="Encerrar sessões"
          text="Tem certeza que deseja encerrar suas sessões em todos os dispositivos?"
          confirmLabel="Encerrar sessões"
          onCancel={() => setSignOutOpen(false)}
          onConfirm={async () => {
            setSignOutOpen(false);
            await handleSignOutAll();
          }}
        />
      )}
      {delOpen && <DeleteAccountModal onClose={() => setDelOpen(false)} />}
    </AppLayout>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FieldInline({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:text-muted-foreground"
      />
    </div>
  );
}

function ThemeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (p1.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres.");
    if (p1 !== p2) return toast.error("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) return toast.error("Não foi possível atualizar a senha.");
    toast.success("Senha atualizada com sucesso.");
    onClose();
  }
  return (
    <Modal title="Alterar senha" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <FieldInline label="Nova senha" value={p1} onChange={setP1} />
        <FieldInline label="Confirmar nova senha" value={p2} onChange={setP2} />
        <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Atualizar senha
        </button>
      </form>
    </Modal>
  );
}

function ConfirmModal({ title, text, confirmLabel, onCancel, onConfirm }: { title: string; text: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted-foreground">{text}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium">Cancelar</button>
        <button onClick={onConfirm} className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">{confirmLabel}</button>
      </div>
    </Modal>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [txt, setTxt] = useState("");
  const ok = txt.trim() === "EXCLUIR";
  return (
    <Modal title="Excluir conta" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Essa ação não pode ser desfeita. Seus conteúdos, cronogramas e preferências serão removidos.
      </p>
      <label className="mt-4 block text-xs font-medium">Digite EXCLUIR para confirmar</label>
      <input value={txt} onChange={(e) => setTxt(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium">Cancelar</button>
        <button
          disabled={!ok}
          onClick={() => {
            toast.success("Solicitação de exclusão registrada. Entraremos em contato.");
            onClose();
          }}
          className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
        >
          Excluir conta
        </button>
      </div>
    </Modal>
  );
}

type PlanId = "basic" | "premium";

const PLAN_PRICES: Record<PlanId, string> = {
  basic: "R$ 24,90",
  premium: "R$ 29,90",
};

const BASIC_BENEFITS = [
  "Até 100 gerações por mês",
  "Gerador de Conteúdo",
  "Ideias personalizadas",
  "Roteiros prontos",
  "Legendas estratégicas",
  "CTAs",
  "Cronograma de publicações",
  "Conteúdo para Instagram, TikTok, Reels e Shorts",
  "Nunca mais ficar sem assunto para postar",
];

const PREMIUM_HIGHLIGHTS = [
  "Mais direção estratégica",
  "Mais velocidade para criar conteúdo",
  "Mais oportunidades de gerar conversas",
  "Mais chances de transformar atenção em clientes",
];

const PREMIUM_BENEFITS = [
  "Tudo do Basic",
  "Remix Inteligente ilimitado",
  "Estratégias avançadas de conteúdo",
  "Sistema Anti-Bloqueio Criativo",
  "Ganchos de alta retenção",
  "Calendários otimizados para crescimento",
  "Conteúdos focados em autoridade",
  "Tendências adaptadas ao seu nicho",
  "IA estratégica avançada",
  "Acesso antecipado a novos recursos",
  "Prioridade nas atualizações",
  "Criado para quem quer crescer mais rápido",
];

function SubscriptionCard() {
  const { plan, loading, refresh } = usePlan();
  const [busy, setBusy] = useState<null | string>(null);

  async function assinarCartao(p: PlanId) {
    const key = `card:${p}`;
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-mercadopago-subscription", {
        body: { plan: p, backUrl: `${window.location.origin}/configuracoes?subscription=pending` },
      });
      if (error) throw error;
      const url = (data as { checkoutUrl?: string } | null)?.checkoutUrl;
      if (!url) throw new Error("URL de checkout não recebida.");
      window.location.href = url;
    } catch (e) {
      console.error("[subscription:card]", e);
      toast.error("Não foi possível iniciar o checkout. Tente novamente.");
      setBusy(null);
    }
  }

  async function gerenciar() {
    await refresh();
    toast.message("Para alterar ou cancelar sua assinatura, acesse sua conta no Mercado Pago.");
  }

  return (
    <section id="assinatura" className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <CreditCard className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold">Assinatura</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
            {plan === null ? (
              <span className="font-medium text-foreground">Plano atual: <span className="text-destructive">Sem assinatura ativa</span></span>
            ) : (
              <span className="font-medium text-foreground">
                Plano atual: <span className="text-primary">RocketAI {plan === "premium" ? "Premium" : "Basic"}</span>
              </span>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PlanCard
              kind="basic"
              currentPlan={plan}
              busy={busy}
              onCard={() => assinarCartao("basic")}
            />
            <PlanCard
              kind="premium"
              currentPlan={plan}
              busy={busy}
              onCard={() => assinarCartao("premium")}
            />
          </div>

          {plan === "premium" && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={gerenciar}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40"
              >
                Gerenciar assinatura
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PlanCard({
  kind,
  currentPlan,
  busy,
  onCard,
}: {
  kind: PlanId;
  currentPlan: PlanId | null;
  busy: string | null;
  onCard: () => void;
}) {
  const isPremium = kind === "premium";
  const isCurrent = currentPlan === kind;
  const cardKey = `card:${kind}`;
  const loadingCard = busy === cardKey;
  const disabled = !!busy;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 transition ${
        isPremium
          ? "border-primary/50 bg-[image:var(--gradient-surface)] shadow-[var(--shadow-glow)]"
          : "border-border bg-background shadow-[var(--shadow-soft)]"
      }`}
    >
      {isPremium && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}

      {isPremium && (
        <div className="relative z-10 mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[image:var(--gradient-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-lift)]">
            Mais escolhido
          </span>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            Melhor custo-benefício
          </span>
        </div>
      )}

      <div className="relative z-10">
        <h3 className="text-xl font-extrabold tracking-tight">
          {isPremium ? "ROCKETAI PREMIUM" : "ROCKETAI BASIC"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPremium
            ? "Para quem não quer apenas postar. Quer ser lembrado."
            : "Para quem quer parar de improvisar nas redes sociais."}
        </p>

        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight">{PLAN_PRICES[kind]}</span>
          <span className="text-sm text-muted-foreground">/mês</span>
        </div>
        {isPremium && (
          <p className="mt-1 text-xs font-medium text-primary">Apenas R$5 a mais que o Basic</p>
        )}

        {isPremium && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <ul className="space-y-2 text-sm">
              {PREMIUM_HIGHLIGHTS.map((b) => (
                <BenefitRow key={b}>{b}</BenefitRow>
              ))}
            </ul>
          </div>
        )}

        <ul className="mt-5 space-y-2 text-sm">
          {(isPremium ? PREMIUM_BENEFITS : BASIC_BENEFITS).map((b) => (
            <BenefitRow key={b}>{b}</BenefitRow>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-6">
        <button
          disabled={disabled || isCurrent}
          onClick={onCard}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
            isPremium
              ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]"
              : "border border-border bg-card text-foreground hover:border-primary/40"
          }`}
        >
          {loadingCard && <Loader2 className="h-4 w-4 animate-spin" />}
          <CreditCard className="h-4 w-4" />
          {isCurrent ? "Plano atual" : `Assinar ${isPremium ? "Premium" : "Basic"}`}
        </button>
      </div>
    </div>
  );
}

function BenefitRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}



