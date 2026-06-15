import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useGenerateAI } from "@/hooks/use-generate-ai";
import { usePerfilNegocio, perfilParaIA } from "@/hooks/use-perfil-negocio";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { PremiumModal } from "@/components/PremiumModal";
import { salvarConteudo } from "@/lib/conteudos";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Wand2, Sparkles, Loader2, Copy, Calendar, HelpCircle, Search,
  Link2, Rocket, CheckCircle2, Target, Lightbulb, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/remix")({
  head: () => ({
    meta: [
      { title: "Remix Inteligente — RocketAI" },
      { name: "description", content: "Pesquise, analise e adapte referências em conteúdos otimizados para o resultado que você quer." },
    ],
  }),
  component: RemixPage,
});

/* ---------- Tipos ---------- */
type ResultadoObjetivo =
  | "engajamento" | "seguidores" | "autoridade" | "vendas"
  | "agendamentos" | "viralizar" | "relacionamento";

type Intensidade = "leve" | "media" | "forte";
type Estilo =
  | "educativo" | "engracado" | "storytelling" | "autoridade"
  | "conversao" | "emocional" | "polemico" | "viral";

type ElementoPreservar =
  | "gancho" | "storytelling" | "estrutura" | "humor" | "cta" | "ritmo" | "sequencia";

type Pesquisas = {
  pesquisas?: {
    instagram?: string[]; tiktok?: string[]; reels?: string[]; youtubeShorts?: string[];
  };
  explicacao?: string;
};

type AnaliseReferencia = {
  analise?: {
    estrutura?: string; gancho?: string; storytelling?: string;
    cta?: string; ritmo?: string; sequenciaCenas?: string;
    tom?: string; porqueFunciona?: string;
  };
};

type RemixFinal = {
  novaVersao?: {
    titulo?: string;
    formatoRecomendado?: string;
    roteiro?: Array<{ cena: number; instrucao: string; textoNaTela: string; fala?: string }>;
    legenda?: string;
    cta?: string;
    hashtags?: string[];
  };
  explicacaoEstrategica?: string;
  oQueFoiPreservado?: string[];
  oQueFoiAdaptado?: string[];
};

/* ---------- Constantes ---------- */
const OBJETIVOS: Array<{ id: ResultadoObjetivo; emoji: string; titulo: string; desc: string }> = [
  { id: "engajamento",   emoji: "❤️", titulo: "Mais engajamento",  desc: "Curtidas, comentários e salvamentos." },
  { id: "seguidores",    emoji: "📈", titulo: "Mais seguidores",   desc: "Crescer a base de seguidores." },
  { id: "autoridade",    emoji: "🎓", titulo: "Mais autoridade",   desc: "Ser visto como referência no nicho." },
  { id: "vendas",        emoji: "💰", titulo: "Mais vendas",       desc: "Converter audiência em clientes." },
  { id: "agendamentos",  emoji: "📅", titulo: "Mais agendamentos", desc: "Encher a agenda do seu serviço." },
  { id: "viralizar",     emoji: "🚀", titulo: "Viralizar",         desc: "Alcance massivo em pouco tempo." },
  { id: "relacionamento",emoji: "🤝", titulo: "Relacionamento",    desc: "Aproximar e fidelizar a audiência." },
];

const QUEBRA_GELOS = [
  "Quero encontrar vídeos engraçados.",
  "Quero encontrar conteúdos polêmicos.",
  "Quero encontrar vídeos emocionais.",
  "Quero encontrar conteúdos educativos.",
  "Quero encontrar vídeos de transformação.",
  "Quero encontrar conteúdos que geram muitos comentários.",
  "Quero encontrar conteúdos que geram compartilhamentos.",
  "Quero encontrar conteúdos que geram vendas.",
  "Quero encontrar conteúdos que geram seguidores.",
  "Quero encontrar conteúdos que geram autoridade.",
];

const INTENSIDADES: Array<{ id: Intensidade; cor: string; titulo: string; desc: string; emoji: string }> = [
  { id: "leve",  cor: "bg-emerald-500",  titulo: "Leve",  desc: "Mantém cerca de 80% da estrutura. Ideal para adaptações rápidas.", emoji: "🟢" },
  { id: "media", cor: "bg-amber-500",    titulo: "Média", desc: "Mantém só as partes mais fortes. Evita parecer uma cópia.",       emoji: "🟡" },
  { id: "forte", cor: "bg-rose-500",     titulo: "Forte", desc: "Preserva só a ideia central. Cria algo praticamente novo.",       emoji: "🔴" },
];

const ELEMENTOS: Array<{ id: ElementoPreservar; titulo: string; tooltip: string }> = [
  { id: "gancho",       titulo: "Gancho",            tooltip: "A primeira frase, cena ou ideia que prende a atenção da pessoa." },
  { id: "storytelling", titulo: "Storytelling",      tooltip: "A forma como o conteúdo conta uma história." },
  { id: "estrutura",    titulo: "Estrutura",         tooltip: "A organização do conteúdo do início ao fim." },
  { id: "humor",        titulo: "Humor",             tooltip: "O estilo engraçado ou divertido utilizado." },
  { id: "cta",          titulo: "CTA",               tooltip: "A chamada para ação. Ex.: comentar, salvar, compartilhar, comprar." },
  { id: "ritmo",        titulo: "Ritmo do vídeo",    tooltip: "A velocidade do conteúdo e dos cortes." },
  { id: "sequencia",    titulo: "Sequência de cenas",tooltip: "A ordem visual das cenas utilizadas." },
];

const ESTILOS: Array<{ id: Estilo; emoji: string; titulo: string }> = [
  { id: "educativo",   emoji: "📚", titulo: "Educativo" },
  { id: "engracado",   emoji: "😂", titulo: "Engraçado" },
  { id: "storytelling",emoji: "📖", titulo: "Storytelling" },
  { id: "autoridade",  emoji: "🎓", titulo: "Autoridade" },
  { id: "conversao",   emoji: "💰", titulo: "Conversão" },
  { id: "emocional",   emoji: "❤️", titulo: "Emocional" },
  { id: "polemico",    emoji: "🔥", titulo: "Polêmico" },
  { id: "viral",       emoji: "🚀", titulo: "Viral" },
];

function copy(text: string, label: string) {
  navigator.clipboard?.writeText(text)
    .then(() => toast.success(`${label} copiado`))
    .catch(() => toast.error("Não foi possível copiar"));
}

/* ---------- Componente ---------- */
function RemixPage() {
  const { user } = useAuth();
  const { perfil } = usePerfilNegocio();
  const { generate, loading } = useGenerateAI();
  const { isPremium, loading: planLoading } = usePlan();
  const [premiumOpen, setPremiumOpen] = useState(false);

  // Bloqueio Premium: se Basic, abre modal e impede uso da página
  const ensurePremium = () => {
    if (planLoading) return false;
    if (!isPremium) {
      setPremiumOpen(true);
      return false;
    }
    return true;
  };

  // estado das etapas
  const [objetivo, setObjetivo] = useState<ResultadoObjetivo | null>(null);
  const [descricao, setDescricao] = useState("");
  const [pesquisas, setPesquisas] = useState<Pesquisas | null>(null);
  const [refLink, setRefLink] = useState("");
  const [analise, setAnalise] = useState<AnaliseReferencia | null>(null);
  const [intensidade, setIntensidade] = useState<Intensidade | null>(null);
  const [preservar, setPreservar] = useState<ElementoPreservar[]>([]);
  const [estilo, setEstilo] = useState<Estilo | null>(null);
  const [final, setFinal] = useState<RemixFinal | null>(null);

  // loading individual por etapa (para evitar duplos cliques)
  const [busy, setBusy] = useState<null | "pesquisas" | "analise" | "final">(null);

  const togglePreservar = (id: ElementoPreservar) =>
    setPreservar((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const insertQuebraGelo = (txt: string) => {
    setDescricao((d) => (d.trim() ? `${d.trim()}\n${txt}` : txt));
  };

  /* ---------- Ações IA ---------- */
  const handlePesquisas = async () => {
    if (busy || loading) return; if (!ensurePremium()) return;
    if (!objetivo) return toast.error("Escolha o resultado desejado primeiro.");
    if (descricao.trim().length < 5) return toast.error("Descreva o tipo de conteúdo que quer encontrar.");
    setBusy("pesquisas");
    const res = await generate<Pesquisas>({
      tipoDeGeracao: "remix_pesquisas",
      pedidoPersonalizado: descricao,
      objetivo,
      perfilDeConteudo: perfilParaIA(perfil),
      mensagemUsuario: `Objetivo principal: ${objetivo}.`,
    });
    setBusy(null);
    if (!res?.pesquisas) return;
    setPesquisas(res);
    toast.success("Pesquisas geradas");
  };

  const handleAnalise = async () => {
    if (busy || loading) return; if (!ensurePremium()) return;
    if (refLink.trim().length < 5) return toast.error("Cole um link ou descreva a referência.");
    setBusy("analise");
    const res = await generate<AnaliseReferencia>({
      tipoDeGeracao: "remix_analise_referencia",
      pedidoPersonalizado: descricao,
      objetivo: objetivo ?? undefined,
      perfilDeConteudo: perfilParaIA(perfil),
      referenciaRemix: { tipo: "link", link: refLink, descricao },
    });
    setBusy(null);
    if (!res?.analise) return;
    setAnalise(res);
    toast.success("Referência analisada");
  };

  const handleFinal = async () => {
    if (busy || loading) return; if (!ensurePremium()) return;
    if (!objetivo) return toast.error("Escolha o resultado desejado.");
    if (!intensidade) return toast.error("Escolha a intensidade da adaptação.");
    if (!estilo) return toast.error("Escolha o estilo da adaptação.");
    if (!analise) return toast.error("Analise uma referência antes de gerar.");
    setBusy("final");
    const res = await generate<RemixFinal>({
      tipoDeGeracao: "remix_final",
      pedidoPersonalizado: descricao,
      objetivo,
      perfilDeConteudo: perfilParaIA(perfil),
      referenciaRemix: { tipo: "link", link: refLink, descricao },
      mensagemUsuario: JSON.stringify({
        intensidade,
        estilo,
        elementosPreservar: preservar,
        analiseReferencia: analise.analise,
        pesquisas: pesquisas?.pesquisas,
      }),
    });
    setBusy(null);
    if (!res?.novaVersao) return;
    setFinal(res);
    toast.success("Remix gerado");
  };

  const handleSalvar = async () => {
    if (!user) return toast.error("Faça login para salvar.");
    const nv = final?.novaVersao;
    if (!nv) return;
    const hashtags = (nv.hashtags ?? []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    const { error } = await salvarConteudo({
      user_id: user.id,
      nicho: perfil.nicho || null,
      objetivo: objetivo ?? null,
      tema: nv.titulo ?? null,
      formato: nv.formatoRecomendado ?? null,
      titulo: nv.titulo ?? null,
      legenda: nv.legenda ?? null,
      hashtags,
      roteiro_video: nv.roteiro ? JSON.stringify(nv.roteiro) : null,
      status: "Pronto para postar",
      origem: "remix",
    });
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Salvo no cronograma");
  };

  /* ---------- Progresso ---------- */
  const completos = useMemo(() => {
    let n = 0;
    if (objetivo) n++;
    if (descricao.trim().length > 5) n++;
    if (pesquisas) n++;
    if (analise) n++;
    if (intensidade) n++;
    if (preservar.length) n++;
    if (estilo) n++;
    if (final) n++;
    return n;
  }, [objetivo, descricao, pesquisas, analise, intensidade, preservar, estilo, final]);

  return (
    <AppLayout>
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} variant="remix" />
      <TooltipProvider delayDuration={150}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Hero */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5 text-primary" /> Remix Inteligente 2.0
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Pesquise, analise e adapte. Em uma ferramenta só.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Transforme referências em conteúdos novos otimizados para o resultado que você quer alcançar.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[image:var(--gradient-primary)] transition-all"
                  style={{ width: `${(completos / 8) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{completos}/8</span>
            </div>
          </div>

          {/* ETAPA 1 */}
          <StepCard step={1} icon={Target} title="Qual resultado você quer gerar?" subtitle="Escolha o principal objetivo deste conteúdo.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {OBJETIVOS.map((o) => (
                <SelectablePill
                  key={o.id}
                  selected={objetivo === o.id}
                  onClick={() => setObjetivo(o.id)}
                  emoji={o.emoji}
                  title={o.titulo}
                  desc={o.desc}
                />
              ))}
            </div>
          </StepCard>

          {/* ETAPA 2 */}
          <StepCard step={2} icon={Search} title="Que tipo de conteúdo você quer encontrar?" subtitle="Quanto mais detalhes você fornecer, melhores serão as sugestões geradas.">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Ex.: Quero encontrar vídeos simples que ajudam a vender mais no meu nicho..."
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-primary" /> Precisa de inspiração?
              </p>
              <div className="flex flex-wrap gap-2">
                {QUEBRA_GELOS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => insertQuebraGelo(q)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40 hover:bg-accent"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>
          </StepCard>

          {/* ETAPA 3 */}
          <StepCard step={3} icon={Search} title="Pesquisas inteligentes" subtitle="Receba palavras-chave personalizadas para encontrar referências em cada plataforma.">
            <button
              onClick={handlePesquisas}
              disabled={busy === "pesquisas" || loading || !objetivo || descricao.trim().length < 5}
              className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-50"
            >
              {busy === "pesquisas" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy === "pesquisas" ? "Gerando pesquisas..." : "Gerar pesquisas"}
            </button>

            {pesquisas?.pesquisas && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <PesquisaBox titulo="📸 Instagram"      itens={pesquisas.pesquisas.instagram} />
                <PesquisaBox titulo="🎵 TikTok"         itens={pesquisas.pesquisas.tiktok} />
                <PesquisaBox titulo="🎬 Reels"          itens={pesquisas.pesquisas.reels} />
                <PesquisaBox titulo="▶️ YouTube Shorts" itens={pesquisas.pesquisas.youtubeShorts} />
              </div>
            )}
          </StepCard>

          {/* ETAPA 4 */}
          <StepCard step={4} icon={Link2} title="Encontrou uma referência?" subtitle="Cole o link do Instagram, TikTok ou YouTube Shorts.">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={refLink}
                onChange={(e) => setRefLink(e.target.value)}
                placeholder="https://instagram.com/reel/..."
                className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <button
                onClick={handleAnalise}
                disabled={busy === "analise" || loading || refLink.trim().length < 5}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-50"
              >
                {busy === "analise" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {busy === "analise" ? "Analisando..." : "Analisar referência"}
              </button>
            </div>

            {analise?.analise && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Estrutura", analise.analise.estrutura],
                  ["Gancho", analise.analise.gancho],
                  ["Storytelling", analise.analise.storytelling],
                  ["CTA", analise.analise.cta],
                  ["Ritmo", analise.analise.ritmo],
                  ["Sequência de cenas", analise.analise.sequenciaCenas],
                  ["Tom", analise.analise.tom],
                  ["Por que funciona", analise.analise.porqueFunciona],
                ].map(([k, v]) => v ? (
                  <div key={k} className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</p>
                    <p className="mt-1 text-sm">{v}</p>
                  </div>
                ) : null)}
              </div>
            )}
          </StepCard>

          {/* ETAPA 5 */}
          <StepCard step={5} icon={Wand2} title="Quão diferente você quer que o conteúdo fique?" subtitle="Escolha a intensidade da adaptação.">
            <div className="grid gap-3 sm:grid-cols-3">
              {INTENSIDADES.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setIntensidade(i.id)}
                  className={cn(
                    "rounded-2xl border bg-card p-5 text-left transition-all shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-primary/40",
                    intensidade === i.id ? "border-primary ring-2 ring-primary/20" : "border-border",
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", i.cor)} />
                    <span className="text-sm font-semibold">{i.emoji} {i.titulo}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{i.desc}</p>
                </button>
              ))}
            </div>
          </StepCard>

          {/* ETAPA 6 */}
          <StepCard step={6} icon={CheckCircle2} title="O que você quer preservar da referência?" subtitle="Selecione um ou mais elementos. Clique no ? para entender cada um.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ELEMENTOS.map((el) => {
                const active = preservar.includes(el.id);
                return (
                  <div
                    key={el.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition-all shadow-[var(--shadow-soft)]",
                      active ? "border-primary ring-2 ring-primary/20" : "border-border",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => togglePreservar(el.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className={cn(
                        "grid h-5 w-5 place-items-center rounded border",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                      )}>
                        {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </span>
                      <span className="text-sm font-medium">{el.titulo}</span>
                    </button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="grid h-7 w-7 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary transition hover:bg-primary/20"
                          aria-label={`O que é ${el.titulo}`}
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        {el.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </StepCard>

          {/* ETAPA 7 */}
          <StepCard step={7} icon={Sparkles} title="Como você quer adaptar?" subtitle="Escolha o estilo da nova versão.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ESTILOS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEstilo(e.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-primary/40",
                    estilo === e.id ? "border-primary ring-2 ring-primary/20" : "border-border",
                  )}
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-sm font-semibold">{e.titulo}</span>
                </button>
              ))}
            </div>
          </StepCard>

          {/* ETAPA 8 */}
          <StepCard step={8} icon={Rocket} title="Gerar Remix Inteligente" subtitle="A IA combina pesquisa, referência e estratégia para criar o conteúdo final.">
            <button
              onClick={handleFinal}
              disabled={busy === "final" || loading || !objetivo || !intensidade || !estilo || !analise}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-50 sm:w-auto"
            >
              {busy === "final" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
              {busy === "final" ? "Gerando Remix..." : "Gerar Remix Inteligente"}
              {!busy && <ArrowRight className="h-5 w-5" />}
            </button>
            {(!analise || !intensidade || !estilo || !objetivo) && (
              <p className="mt-3 text-xs text-muted-foreground">
                Complete as etapas anteriores para liberar a geração.
              </p>
            )}
          </StepCard>

          {/* RESULTADO */}
          {final?.novaVersao && (
            <section className="mt-4 rounded-3xl border border-primary/30 bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Remix gerado
                </span>
                {final.novaVersao.formatoRecomendado && (
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {final.novaVersao.formatoRecomendado}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight">{final.novaVersao.titulo}</h2>

              {final.explicacaoEstrategica && (
                <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Explicação estratégica</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{final.explicacaoEstrategica}</p>
                </div>
              )}

              {final.novaVersao.roteiro && final.novaVersao.roteiro.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roteiro</p>
                  <ol className="space-y-2">
                    {final.novaVersao.roteiro.map((c, i) => (
                      <li key={i} className="rounded-xl border border-border bg-background p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{c.cena ?? i + 1}</span>
                          <span className="font-medium">Cena {c.cena ?? i + 1}</span>
                        </div>
                        {c.instrucao && <p className="mt-1 text-muted-foreground">🎬 {c.instrucao}</p>}
                        {c.textoNaTela && <p className="mt-1">📝 <span className="font-medium">Texto:</span> {c.textoNaTela}</p>}
                        {c.fala && <p className="mt-1">🎙️ <span className="font-medium">Fala:</span> {c.fala}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {final.novaVersao.legenda && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legenda</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{final.novaVersao.legenda}</p>
                </div>
              )}

              {final.novaVersao.cta && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA</p>
                  <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">{final.novaVersao.cta}</p>
                </div>
              )}

              {final.novaVersao.hashtags && final.novaVersao.hashtags.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hashtags</p>
                  <p className="text-sm text-primary">
                    {final.novaVersao.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                  </p>
                </div>
              )}

              {(final.oQueFoiPreservado?.length || final.oQueFoiAdaptado?.length) && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {final.oQueFoiPreservado?.length ? (
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">O que foi preservado</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {final.oQueFoiPreservado.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {final.oQueFoiAdaptado?.length ? (
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">O que foi adaptado</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {final.oQueFoiAdaptado.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <ActionBtn onClick={() => copy(final.novaVersao?.legenda ?? "", "Legenda")}><Copy className="h-4 w-4" />Copiar legenda</ActionBtn>
                <ActionBtn onClick={() => copy((final.novaVersao?.roteiro ?? []).map((c) => `Cena ${c.cena}: ${c.instrucao}\nTexto: ${c.textoNaTela}${c.fala ? `\nFala: ${c.fala}` : ""}`).join("\n\n"), "Roteiro")}><Copy className="h-4 w-4" />Copiar roteiro</ActionBtn>
                <ActionBtn onClick={handleFinal}>Gerar nova versão</ActionBtn>
                <ActionBtn primary onClick={handleSalvar}><Calendar className="h-4 w-4" />Salvar no cronograma</ActionBtn>
              </div>
            </section>
          )}
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}

/* ---------- Subcomponentes ---------- */
function StepCard({
  step, icon: Icon, title, subtitle, children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="mb-5 flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Etapa {step}</p>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function SelectablePill({
  selected, onClick, emoji, title, desc,
}: { selected: boolean; onClick: () => void; emoji: string; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-full flex-col items-start gap-1 rounded-2xl border bg-card p-4 text-left transition-all",
        "shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-primary/40",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}

function PesquisaBox({ titulo, itens }: { titulo: string; itens?: string[] }) {
  const list = itens ?? [];
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{titulo}</p>
        <button
          onClick={() => copy(list.join("\n"), titulo)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium transition hover:border-primary/40"
        >
          <Copy className="h-3 w-3" /> Copiar
        </button>
      </div>
      <ul className="space-y-1.5">
        {list.map((p, i) => (
          <li key={i} className="rounded-lg bg-accent/60 px-3 py-1.5 text-sm">📌 {p}</li>
        ))}
      </ul>
    </div>
  );
}

function ActionBtn({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
        primary
          ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]"
          : "border border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
