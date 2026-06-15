import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { OptionCard } from "@/components/OptionCard";
import { ChatField } from "@/components/ChatField";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  NICHOS, OBJETIVOS, FREQUENCIAS, PERIODOS,
  gerarTemasDeTexto, recomendarFormato,
} from "@/lib/mock-data";
import { useGenerateAI } from "@/hooks/use-generate-ai";
import { usePerfilNegocio, perfilParaIA } from "@/hooks/use-perfil-negocio";
import { useAuth } from "@/hooks/use-auth";
import { salvarConteudo } from "@/lib/conteudos";
import { supabase } from "@/integrations/supabase/client";

import {
  ArrowLeft, ArrowRight, Copy, Download, Image as ImageIcon,
  Layers, Video, Sparkles, Calendar, RefreshCcw, Plus, Info, Loader2, Play,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/gerador")({
  head: () => ({
    meta: [
      { title: "Gerador de Posts — RocketAI" },
      { name: "description", content: "Crie posts para Instagram em etapas guiadas." },
    ],
  }),
  component: Gerador,
});

const STEPS = ["Nicho", "Objetivo", "Tema", "Ideias", "Formato", "Conteúdo", "Cronograma"];

type Tema = { id: string; label: string; desc: string };
type IdeiaIA = {
  titulo: string;
  explicacao: string;
  legenda: string;
  hashtags: string[];
  formatoRecomendado: string;
  cta?: string;
  motivoDaIdeia?: string;
};
type CronogramaItem = {
  id?: string; // id no Supabase quando persistido
  semana: string;
  dia: string;
  tema: string;
  formato: string;
  titulo: string;
  status: string;
  periodo?: string;
  objetivoDoPost?: string;
};


function Gerador() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { perfil } = usePerfilNegocio();

  const [step, setStep] = useState(0);
  const [nicho, setNicho] = useState<string | null>(null);
  const [nichoCustom, setNichoCustom] = useState("");
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [tema, setTema] = useState<string | null>(null);
  const [ideiaIdx, setIdeiaIdx] = useState<number | null>(null);
  const [formato, setFormato] = useState<"foto" | "carrossel" | "video" | null>(null);
  const [freq, setFreq] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<number, string>>({});

  const [extraTemas, setExtraTemas] = useState<Tema[]>([]);
  const [chatTemas, setChatTemas] = useState<Tema[]>([]);
  const [ideiasIA, setIdeiasIA] = useState<IdeiaIA[]>([]);
  const [ideiasLoaded, setIdeiasLoaded] = useState(false);
  const [parecidasMap, setParecidasMap] = useState<Record<number, IdeiaIA[]>>({});
  const [parecidasAbertas, setParecidasAbertas] = useState<Record<number, boolean>>({});
  const [formatoResposta, setFormatoResposta] = useState<null | {
    pergunta: string; texto: string; recomendado: "foto" | "carrossel" | "video"; alternativa: "foto" | "carrossel" | "video";
  }>(null);
  const [cronograma, setCronograma] = useState<CronogramaItem[] | null>(null);
  const [interpretacao, setInterpretacao] = useState<{ resumo: string; total: string } | null>(null);

  // Conteúdo gerado para etapa 5
  const [carrosselData, setCarrosselData] = useState<{
    tituloCarrossel: string; estruturaCarrossel: Array<{ slide: number; texto: string; orientacaoVisual?: string }>;
    legenda: string; hashtags: string[];
  } | null>(null);
  const [videoData, setVideoData] = useState<{
    tituloVideo: string; tipoVideo: string; duracaoRecomendada: string;
    roteiroVideo: Array<{ cena: number; instrucaoDeGravacao: string; textoNaTela: string; falaOuLegenda?: string }>;
    legenda: string; hashtags: string[];
  } | null>(null);

  const { generate, loading } = useGenerateAI();

  const setChat = (v: string) => setChats((c) => ({ ...c, [step]: v }));

  // Labels reais (não ids) para enviar à IA
  const nichoFinalLabel = useMemo(() => {
    if (nichoCustom?.trim()) return nichoCustom.trim();
    const m = NICHOS.find((n) => n.id === nicho);
    return m?.label ?? perfil.nicho ?? undefined;
  }, [nicho, nichoCustom, perfil.nicho]);

  const objetivoFinalLabel = useMemo(
    () => OBJETIVOS.find((o) => o.id === objetivo)?.label ?? objetivo ?? undefined,
    [objetivo],
  );

  // Apenas temas gerados pela IA (não usar mais a lista genérica fixa)
  const todosTemas = useMemo<Tema[]>(() => [...chatTemas, ...extraTemas], [chatTemas, extraTemas]);

  const temaFinalLabel = useMemo(
    () => todosTemas.find((t) => t.id === tema)?.label ?? tema ?? undefined,
    [tema, todosTemas],
  );

  // mantém compat para chamadas existentes
  const nichoFinal = nichoFinalLabel;

  const ideiaEscolhida = ideiaIdx !== null ? ideiasIA[ideiaIdx] : null;

  const canNext = [
    nicho || nichoCustom, objetivo, tema, ideiaIdx !== null, formato, true, freq && periodo,
  ][step];

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const baseCtx = () => ({
    nicho: nichoFinalLabel,
    objetivo: objetivoFinalLabel,
    tema: temaFinalLabel,
    formato: formato ?? undefined,
    pedidoPersonalizado: chats[step] ?? undefined,
    etapaAtual: STEPS[step],
    perfilDeConteudo: perfilParaIA(perfil),
  });


  // Carrega ideias da IA ao entrar na etapa 3
  useEffect(() => {
    if (step !== 3 || ideiasLoaded || !tema) return;
    (async () => {
      const res = await generate<{ ideias: IdeiaIA[] }>({
        nicho: nichoFinalLabel,
        objetivo: objetivoFinalLabel,
        tema: temaFinalLabel,
        perfilDeConteudo: perfilParaIA(perfil),
        tipoDeGeracao: "gerar_ideias",
      });
      const ideias = Array.isArray(res?.ideias) ? res!.ideias : [];
      setIdeiasIA(ideias);
      setIdeiasLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, tema]);


  // Gera o conteúdo do formato escolhido ao entrar na etapa 5
  useEffect(() => {
    if (step !== 5 || !ideiaEscolhida || !formato) return;
    if (formato === "carrossel" && !carrosselData) {
      (async () => {
        const res = await generate<typeof carrosselData>({
          ...baseCtx(),
          tipoDeGeracao: "gerar_carrossel",
          ideiaAtual: {
            titulo: ideiaEscolhida.titulo,
            legenda: ideiaEscolhida.legenda,
            hashtags: Array.isArray(ideiaEscolhida.hashtags) ? ideiaEscolhida.hashtags.join(" ") : "",
            formato: "carrossel",
          },
        });
        if (res) setCarrosselData(res);
      })();
    }
    if (formato === "video" && !videoData) {
      (async () => {
        const res = await generate<typeof videoData>({
          ...baseCtx(),
          tipoDeGeracao: "gerar_roteiro_video",
          ideiaAtual: {
            titulo: ideiaEscolhida.titulo,
            legenda: ideiaEscolhida.legenda,
            hashtags: Array.isArray(ideiaEscolhida.hashtags) ? ideiaEscolhida.hashtags.join(" ") : "",
            formato: "video",
          },
        });
        if (res) setVideoData(res);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formato]);

  // Limpa temas anteriores quando o usuário muda nicho ou objetivo
  useEffect(() => {
    setChatTemas([]);
    setExtraTemas([]);
    setTema(null);
    setIdeiasIA([]);
    setIdeiasLoaded(false);
    setIdeiaIdx(null);
  }, [nichoFinalLabel, objetivoFinalLabel]);

  const dedupTemas = (lista: Tema[]) => {
    const seen = new Set<string>();
    return lista.filter((t) => {
      const k = t.label.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const fallbackTemasPorNicho = (nichoLabel?: string): Tema[] => {
    const base = (nichoLabel ?? "seu nicho").trim();
    const list = [
      { titulo: `Erros que ${base} comete e como evitar`, descricao: "Mostre falhas comuns do seu público e eduque com autoridade." },
      { titulo: `Bastidores reais do trabalho de ${base}`, descricao: "Aproxime o público mostrando o processo por trás do resultado." },
      { titulo: `Transformação antes e depois — caso real`, descricao: "Use um caso recente para gerar prova social e desejo." },
      { titulo: `Mitos e verdades sobre ${base}`, descricao: "Quebre crenças erradas e mostre domínio do assunto." },
      { titulo: `O que ninguém te conta sobre ${base}`, descricao: "Conteúdo de curiosidade para alcance e salvamentos." },
      { titulo: `Oferta da semana — chamada direta`, descricao: "Use um gancho comercial claro com CTA para WhatsApp ou direct." },
    ];
    return list.map((t, i) => ({
      id: `fallback-${Date.now()}-${i}`,
      label: t.titulo,
      desc: t.descricao,
    }));
  };

  const handleGerarTemasPersonalizados = async () => {
    if (loading) return;
    const res = await generate<{ temas: Array<{ titulo: string; descricao: string; objetivoDoTema?: string }> }>({
      ...baseCtx(),
      tipoDeGeracao: "gerar_temas",
      mensagemUsuario: chats[2]?.trim() || undefined,
    });
    if (!res?.temas?.length) {
      const novos = fallbackTemasPorNicho(nichoFinalLabel);
      setChatTemas((prev) => dedupTemas([...prev, ...novos]));
      toast.message("Mostramos uma sugestão baseada no seu nicho. Tente gerar novamente em instantes.");
      return;
    }
    const novos: Tema[] = res.temas.map((t, i) => ({
      id: `ia-${Date.now()}-${i}`,
      label: t.titulo,
      desc: t.descricao,
    }));
    setChatTemas((prev) => dedupTemas([...prev, ...novos]));
    toast.success(`${novos.length} temas personalizados para ${nichoFinalLabel ?? "seu nicho"}`);
  };

  const handleGerarMaisTemas = async () => {
    if (loading) return;
    const res = await generate<{ temas: Array<{ titulo: string; descricao: string }> }>({
      ...baseCtx(),
      tipoDeGeracao: "gerar_mais_temas",
      mensagemUsuario: `Temas já existentes (não repita): ${todosTemas.map((t) => t.label).join(" | ")}`,
    });
    if (!res?.temas?.length) {
      toast.error("Não conseguimos gerar agora. Tente novamente.");
      return;
    }
    const novos: Tema[] = res.temas.map((t, i) => ({
      id: `ia-extra-${Date.now()}-${i}`,
      label: t.titulo,
      desc: t.descricao,
    }));
    setExtraTemas((prev) => dedupTemas([...prev, ...novos]));
    toast.success(`${novos.length} novos temas gerados pela IA`);
  };

  const handleChatTemas = async (texto: string) => {
    if (loading) return;
    const res = await generate<{ temas: Array<{ titulo: string; descricao: string }> }>({
      ...baseCtx(),
      tipoDeGeracao: "gerar_temas",
      mensagemUsuario: texto,
    });
    if (!res?.temas?.length) {
      const novos = gerarTemasDeTexto(texto).map((t) => ({ ...t, id: `${t.id}-${Date.now()}` }));
      setChatTemas((prev) => dedupTemas([...prev, ...novos]));
      return;
    }
    const novos: Tema[] = res.temas.map((t, i) => ({
      id: `ia-chat-${Date.now()}-${i}`,
      label: t.titulo,
      desc: t.descricao,
    }));
    setChatTemas((prev) => dedupTemas([...prev, ...novos]));
    toast.success(`${novos.length} temas sob medida criados pela IA`);
  };

  const handleChatFormato = async (texto: string) => {
    const res = await generate<{
      formatoRecomendado: string; justificativa: string; alternativa: string;
    }>({
      ...baseCtx(),
      tipoDeGeracao: "recomendar_formato",
      mensagemUsuario: texto,
    });
    if (!res) {
      const r = recomendarFormato(texto);
      setFormatoResposta({ pergunta: texto, ...r });
      return;
    }
    const normalize = (s: string): "foto" | "carrossel" | "video" => {
      const x = s.toLowerCase();
      if (x.includes("foto")) return "foto";
      if (x.includes("vídeo") || x.includes("video")) return "video";
      return "carrossel";
    };
    setFormatoResposta({
      pergunta: texto,
      texto: res.justificativa,
      recomendado: normalize(res.formatoRecomendado),
      alternativa: normalize(res.alternativa),
    });
  };

  const handleGerarParecidas = async (idx: number) => {
    const base = ideiasIA[idx];
    if (!base) return;
    const res = await generate<{ ideias: IdeiaIA[] }>({
      ...baseCtx(),
      tipoDeGeracao: "gerar_ideias_parecidas",
      ideiaAtual: {
        titulo: base.titulo,
        legenda: base.legenda,
        hashtags: Array.isArray(base.hashtags) ? base.hashtags.join(" ") : "",
        formato: base.formatoRecomendado,
      },
    });
    if (!res?.ideias?.length) return;
    setParecidasMap((p) => ({ ...p, [idx]: res.ideias }));
    setParecidasAbertas((p) => ({ ...p, [idx]: true }));
    toast.success("3 ideias parecidas geradas pela IA");
  };

  async function persistirConteudoAtual(status: string) {
    if (!user) return toast.error("Faça login para salvar.");
    if (!ideiaEscolhida) return toast.error("Escolha uma ideia primeiro.");
    const hashtagsStr = Array.isArray(ideiaEscolhida.hashtags) ? ideiaEscolhida.hashtags.join(" ") : "";
    const payload = {
      user_id: user.id,
      nicho: nichoFinalLabel ?? null,
      objetivo: objetivoFinalLabel ?? null,
      tema: temaFinalLabel ?? null,
      formato: formato ?? null,
      titulo: ideiaEscolhida.titulo,
      legenda: (formato === "carrossel" ? carrosselData?.legenda : formato === "video" ? videoData?.legenda : null) ?? ideiaEscolhida.legenda,
      hashtags: (formato === "carrossel" ? carrosselData?.hashtags?.join(" ") : formato === "video" ? videoData?.hashtags?.join(" ") : null) ?? hashtagsStr,
      roteiro_video: formato === "video" && videoData ? JSON.stringify(videoData.roteiroVideo) : null,
      estrutura_carrossel: formato === "carrossel" && carrosselData ? carrosselData.estruturaCarrossel : null,
      status,
      origem: tarefaAtiva ? "cronograma" : "gerador",
    };
    const { error } = await salvarConteudo(payload);
    if (error) {
      console.error("[salvarConteudo]", error);
      return toast.error("Não foi possível salvar.");
    }
    // se veio de uma tarefa do cronograma, atualiza o status dela
    if (tarefaAtiva?.id) {
      await supabase.from("conteudos").update({ status }).eq("id", tarefaAtiva.id).eq("user_id", user.id);
    }
    toast.success("Salvo no cronograma");
  }

  const handleGerarCronograma = async () => {
    if (!freq || !periodo) return;
    const pedido = chats[6] ?? "";

    if (pedido.trim().length > 5) {
      const interp = await generate<{ resumo: string; interpretacao: { totalEstimado: string } }>({
        ...baseCtx(),
        tipoDeGeracao: "interpretar_cronograma_personalizado",
        mensagemUsuario: pedido,
        freq, periodo,
      });
      if (interp) {
        setInterpretacao({ resumo: interp.resumo, total: interp.interpretacao?.totalEstimado ?? "" });
      }
    }

    const res = await generate<{ cronograma: CronogramaItem[]; resumoCronograma: string }>({
      ...baseCtx(),
      tipoDeGeracao: "gerar_cronograma",
      pedidoPersonalizado: pedido,
      freq, periodo,
    });
    const items = Array.isArray(res?.cronograma) ? res!.cronograma : [];
    if (!items.length) {
      toast.error("Não foi possível gerar o cronograma agora. Tente novamente.");
      return;
    }
    toast.success("Cronograma gerado com sucesso");

    // Persistir itens como conteúdos com status "Pendente" e capturar IDs
    if (user) {
      let falhas = 0;
      const persistidos: CronogramaItem[] = [];
      for (const c of items) {
        const { data, error } = await supabase
          .from("conteudos")
          .insert({
            user_id: user.id,
            nicho: nichoFinalLabel ?? null,
            objetivo: objetivoFinalLabel ?? null,
            tema: c.tema,
            formato: c.formato,
            titulo: c.titulo,
            status: c.status ?? "Pendente",
            origem: "cronograma",
          })
          .select("id")
          .single();
        if (error || !data) {
          console.error("[cronograma insert]", error);
          falhas++;
          persistidos.push(c);
        } else {
          persistidos.push({ ...c, id: data.id });
        }
      }
      setCronograma(persistidos);
      if (falhas > 0) toast.error("Alguns itens do cronograma não foram salvos.");
    } else {
      setCronograma(items);
    }
  };

  const [tarefaAtiva, setTarefaAtiva] = useState<CronogramaItem | null>(null);

  const handleRealizarTarefa = async (item: CronogramaItem) => {
    setTarefaAtiva(item);

    // 1) Atualiza status no Supabase para "Em produção"
    if (item.id && user) {
      const { error } = await supabase
        .from("conteudos")
        .update({ status: "Em produção" })
        .eq("id", item.id)
        .eq("user_id", user.id);
      if (error) toast.error("Não foi possível atualizar o status da tarefa.");
      else
        setCronograma((cr) =>
          cr ? cr.map((c) => (c.id === item.id ? { ...c, status: "Em produção" } : c)) : cr,
        );
    }

    // 2) Pré-popula tema/formato
    setTema(item.tema);
    const f = item.formato?.toLowerCase() ?? "";
    const fmt: "foto" | "carrossel" | "video" = f.includes("foto")
      ? "foto"
      : f.includes("vídeo") || f.includes("video")
      ? "video"
      : "carrossel";
    setFormato(fmt);

    // 3) Chama IA com executar_tarefa_cronograma para ideias específicas
    setIdeiasIA([]);
    setIdeiaIdx(null);
    setCarrosselData(null);
    setVideoData(null);
    setStep(3);

    const res = await generate<{ ideias: IdeiaIA[] }>({
      tipoDeGeracao: "executar_tarefa_cronograma",
      nicho: nichoFinalLabel,
      objetivo: objetivoFinalLabel,
      tema: item.tema,
      formato: item.formato,
      perfilDeConteudo: perfilParaIA(perfil),
      tarefaSelecionada: {
        dia: item.dia,
        tema: item.tema,
        formato: item.formato,
        titulo: item.titulo,
        status: item.status,
      },
    });
    const ideias = Array.isArray(res?.ideias) ? res!.ideias : [];
    setIdeiasIA(ideias);
    setIdeiasLoaded(true);
    if (ideias.length) toast.success(`Ideias geradas para: ${item.titulo}`);
  };

  const handleMarcarConcluida = async (item: CronogramaItem) => {
    if (!item.id) return toast.error("Tarefa não foi salva no banco.");
    if (!user) return;
    const { error } = await supabase
      .from("conteudos")
      .update({ status: "Concluído" })
      .eq("id", item.id)
      .eq("user_id", user.id);
    if (error) return toast.error("Não foi possível concluir a tarefa.");
    setCronograma((cr) =>
      cr ? cr.map((c) => (c.id === item.id ? { ...c, status: "Concluído" } : c)) : cr,
    );
    toast.success("Tarefa marcada como concluída");
  };


  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Premium progress stepper */}
        <div className="mb-10 rounded-3xl border border-border bg-card/60 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Fluxo guiado</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight">
                Etapa {step + 1} <span className="text-muted-foreground">de {STEPS.length}</span> · {STEPS[step]}
              </h2>
            </div>
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline">
              {Math.round(((step + 1) / STEPS.length) * 100)}% concluído
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-4 hidden gap-2 sm:flex">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button
                  key={s}
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={`group flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[11px] transition ${
                    active
                      ? "border-primary/50 bg-primary/10 text-primary shadow-[var(--shadow-soft)]"
                      : done
                      ? "border-border bg-secondary/60 text-foreground hover:border-primary/30"
                      : "border-dashed border-border bg-transparent text-muted-foreground"
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="truncate font-semibold">{s}</span>
                </button>
              );
            })}
          </div>
        </div>


        {loading && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando com IA...
          </div>
        )}

        {interpretacao && step === 6 && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm shadow-[var(--shadow-soft)]">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">A IA entendeu seu pedido</p>
            <p className="text-foreground">{interpretacao.resumo}</p>
            {interpretacao.total && <p className="mt-1 text-xs text-muted-foreground">Total estimado: {interpretacao.total}</p>}
          </div>
        )}

        {step === 0 && (
          <StepWrap title="Qual é o seu nicho?" subtitle="Escolha uma opção ou digite o tipo de negócio/perfil que você tem.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {NICHOS.map((n) => (
                <OptionCard key={n.id} title={n.label} description={n.desc} selected={nicho === n.id} onClick={() => setNicho(n.id)} />
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <label className="mb-2 block text-sm font-medium">Digite seu nicho</label>
              <input
                value={nichoCustom}
                onChange={(e) => setNichoCustom(e.target.value)}
                placeholder="Ex.: Estúdio de tatuagem premium"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <ChatField
              title="Quer explicar melhor seu nicho?"
              placeholder="Exemplo: Tenho uma barbearia premium para homens jovens e quero passar uma imagem moderna."
              value={chats[step]} onChange={setChat}
            />
          </StepWrap>
        )}

        {step === 1 && (
          <StepWrap title="Qual é seu objetivo com esse post?" subtitle="Escolha o que você quer alcançar.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {OBJETIVOS.map((o) => (
                <OptionCard key={o.id} title={o.label} description={o.desc} selected={objetivo === o.id} onClick={() => setObjetivo(o.id)} />
              ))}
            </div>
            <ChatField
              title="Quer explicar melhor seu objetivo?"
              placeholder="Exemplo: Quero que as pessoas chamem no WhatsApp para agendar corte e barba."
              value={chats[step]} onChange={setChat}
            />
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap
            title="Escolha um tema para seu post"
            subtitle={`A RocketAI vai sugerir temas pensados para ${nichoFinalLabel ?? "o seu nicho"}.`}
          >
            {todosTemas.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
                <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-surface)] opacity-60" />
                <div className="relative mx-auto max-w-xl">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Gere temas personalizados para o seu nicho</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    A RocketAI vai sugerir temas com base no seu nicho, objetivo e perfil de conteúdo. Sem ideias genéricas.
                  </p>
                  <button
                    type="button"
                    onClick={handleGerarTemasPersonalizados}
                    disabled={loading}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando temas para {nichoFinalLabel ?? "seu nicho"}…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Gerar temas personalizados
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {todosTemas.map((t) => (
                    <OptionCard
                      key={t.id}
                      title={t.label}
                      description={t.desc}
                      selected={tema === t.id}
                      onClick={() => { setTema(t.id); setIdeiasLoaded(false); setIdeiasIA([]); setIdeiaIdx(null); }}
                    />
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleGerarMaisTemas}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition hover:border-primary/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                    {loading ? "Gerando mais temas…" : "Gerar mais temas"}
                  </button>
                </div>
              </>
            )}
            <ChatField
              title="Quer guiar a IA com mais contexto?"
              placeholder="Ex: foco em clientes que têm medo de procedimento, linguagem leve, com humor."
              value={chats[step]} onChange={setChat}
              onSubmit={handleChatTemas}
              submitLabel="Gerar temas sob medida"
            />
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap title="Escolha uma ideia para transformar em post" subtitle="Três ideias geradas pela IA com legenda, hashtags e formato.">
            {ideiasIA.length === 0 && (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A IA está criando ideias para você…</>) : "Sem ideias ainda. Volte e escolha um tema."}
              </div>
            )}
            {ideiasIA.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-3">
                {ideiasIA.map((i, idx) => (
                  <IdeiaCard
                    key={idx}
                    ideia={i}
                    selecionada={ideiaIdx === idx}
                    parecidasAbertas={!!parecidasAbertas[idx]}
                    onSelect={() => setIdeiaIdx(idx)}
                    onGerarParecidas={() => handleGerarParecidas(idx)}
                    parecidas={parecidasMap[idx] ?? []}
                    onUsarParecida={(p) => { setIdeiasIA((arr) => arr.map((x, j) => j === idx ? p : x)); setIdeiaIdx(idx); }}
                  />
                ))}
              </div>
            )}
            <ChatField
              title="Quer ajustar alguma ideia?"
              placeholder="Exemplo: Deixe essa legenda mais engraçada, mais curta e com chamada para WhatsApp."
              value={chats[step]} onChange={setChat}
            />
          </StepWrap>
        )}

        {step === 4 && (
          <StepWrap title="Escolha o formato do post" subtitle="Escolha entre foto, carrossel e vídeo.">
            <div className="grid gap-3 sm:grid-cols-3">
              <OptionCard icon={ImageIcon} title="Foto" description="Produto, serviço, resultado, ambiente ou imagem única chamativa." selected={formato === "foto"} onClick={() => { setFormato("foto"); setCarrosselData(null); setVideoData(null); }} />
              <OptionCard icon={Layers} title="Carrossel" description="Dicas, erros, passos e listas que as pessoas salvam." selected={formato === "carrossel"} onClick={() => { setFormato("carrossel"); setVideoData(null); }} />
              <OptionCard icon={Video} title="Vídeo" description="Bastidores, transformação, processo ou algo dinâmico." selected={formato === "video"} onClick={() => { setFormato("video"); setCarrosselData(null); }} />
            </div>
            <ChatField
              title="Está em dúvida sobre o melhor formato?"
              placeholder="Exemplo: Tenho poucas fotos da minha barbearia. Qual formato seria melhor para esse post?"
              value={chats[step]} onChange={setChat}
              onSubmit={handleChatFormato}
              submitLabel="Pedir recomendação"
            />
            {formatoResposta && (
              <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-4 w-4" /> Recomendação para você
                </div>
                <p className="text-sm leading-relaxed text-foreground">{formatoResposta.texto}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong className="text-foreground">Formato recomendado:</strong> {labelFormato(formatoResposta.recomendado)} •
                  <strong className="text-foreground"> Alternativa:</strong> {labelFormato(formatoResposta.alternativa)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => { setFormato(formatoResposta.recomendado); toast.success(`Formato ${labelFormato(formatoResposta.recomendado)} selecionado`); }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)]">
                    Usar {labelFormato(formatoResposta.recomendado)}
                  </button>
                  {(["carrossel", "video", "foto"] as const)
                    .filter((f) => f !== formatoResposta.recomendado)
                    .map((f) => (
                      <button key={f} onClick={() => { setFormato(f); toast.success(`Formato ${labelFormato(f)} selecionado`); }}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
                        Usar {labelFormato(f)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </StepWrap>
        )}

        {step === 5 && (
          <StepWrap title="Criação do conteúdo" subtitle="Tudo o que você precisa para publicar.">
            {!ideiaEscolhida && <p className="text-sm text-muted-foreground">Volte e escolha uma ideia.</p>}
            {ideiaEscolhida && formato === "foto" && <ConteudoFoto ideia={ideiaEscolhida} onSalvar={() => persistirConteudoAtual("Pronto para postar")} onContinuar={next} />}
            {ideiaEscolhida && formato === "carrossel" && (
              <ConteudoCarrossel
                ideia={ideiaEscolhida}
                data={carrosselData}
                loading={loading && !carrosselData}
                onSalvar={() => persistirConteudoAtual("Pronto para postar")}
                onContinuar={next}
              />
            )}
            {ideiaEscolhida && formato === "video" && (
              <ConteudoVideo
                ideia={ideiaEscolhida}
                data={videoData}
                loading={loading && !videoData}
                onSalvar={() => persistirConteudoAtual("Pronto para postar")}
                onContinuar={next}
              />
            )}
            {ideiaEscolhida && !formato && <p className="text-sm text-muted-foreground">Volte e escolha um formato.</p>}
            <ChatField
              title="Quer personalizar esse conteúdo?"
              placeholder="Exemplo: Quero uma legenda mais curta, mais direta, com chamada para WhatsApp."
              value={chats[step]} onChange={setChat}
            />
          </StepWrap>
        )}

        {step === 6 && (
          <StepWrap title="Crie seu cronograma de posts" subtitle="Vamos organizar suas ideias em uma rotina inteligente de postagem.">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-5 flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
                  <Calendar className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Monte seu plano editorial</h3>
                  <p className="text-xs text-muted-foreground">Escolha frequência, período e, se quiser, descreva regras personalizadas. A IA respeita seu pedido.</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequência</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {FREQUENCIAS.map((f) => (
                    <OptionCard key={f.id} title={f.label} description={f.desc} selected={freq === f.id} onClick={() => setFreq(f.id)} />
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período</h4>
                <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-secondary/50 p-1">
                  {PERIODOS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPeriodo(p.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        periodo === p.id
                          ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]"
                          : "text-muted-foreground hover:bg-card hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cronograma personalizado (opcional)</h4>
                <textarea
                  value={chats[6] ?? ""}
                  onChange={(e) => setChats((c) => ({ ...c, 6: e.target.value }))}
                  rows={3}
                  placeholder="Ex.: Quero postar segunda, quarta e sexta, sem muitos vídeos. Foco em carrosséis educativos."
                  className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                {(chats[6]?.trim().length ?? 0) > 5 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-primary">
                    <Sparkles className="h-3 w-3" /> A IA vai considerar esse pedido ao montar seu cronograma.
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleGerarCronograma}
                  disabled={!freq || !periodo || loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-6 py-4 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:w-auto"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Gerando cronograma...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Gerar cronograma</>
                  )}
                </button>
                {(!freq || !periodo) && (
                  <p className="text-[11px] text-muted-foreground">Escolha frequência e período para habilitar.</p>
                )}
              </div>
            </div>

            {cronograma && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Seu cronograma</h4>
                </div>
                {Array.from(new Set(cronograma.map((c) => c.semana))).map((sem) => (
                  <div key={sem} className="mb-4 last:mb-0">
                    <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{sem}</h5>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted text-xs text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 text-left">Dia</th>
                            <th className="px-3 py-2 text-left">Tema</th>
                            <th className="px-3 py-2 text-left">Formato</th>
                            <th className="px-3 py-2 text-left">Título</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cronograma.filter((c) => c.semana === sem).map((c, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-3 py-2 font-medium">{c.dia}</td>
                              <td className="px-3 py-2 text-muted-foreground">{c.tema}</td>
                              <td className="px-3 py-2 text-muted-foreground">{c.formato}</td>
                              <td className="px-3 py-2">{c.titulo}</td>
                              <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    onClick={() => handleRealizarTarefa(c)}
                                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20"
                                  >
                                    <Play className="h-3 w-3" /> Realizar tarefa
                                  </button>
                                  {c.status !== "Concluído" && (
                                    <button
                                      onClick={() => handleMarcarConcluida(c)}
                                      className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success-foreground hover:bg-success/20"
                                    >
                                      ✓ Concluída
                                    </button>
                                  )}
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => navigate({ to: "/meus-conteudos" })}><RefreshCcw className="h-4 w-4" />Ver no Meus Conteúdos</Button>
                  <Button variant="ghost" onClick={() => toast.success("Cronograma baixado")}><Download className="h-4 w-4" />Baixar cronograma</Button>
                  <Link to="/gerador" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40">
                    <Sparkles className="h-4 w-4 text-primary" />Criar mais ideias
                  </Link>
                </div>
              </div>
            )}
          </StepWrap>
        )}

        {/* Footer nav */}
        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          {step < STEPS.length - 1 && step !== 5 && (
            <button
              onClick={next}
              disabled={!canNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition disabled:opacity-40"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function labelFormato(f: "foto" | "carrossel" | "video") {
  return f === "foto" ? "Foto" : f === "carrossel" ? "Carrossel" : "Vídeo";
}

function copy(text: string, label: string) {
  navigator.clipboard?.writeText(text)
    .then(() => toast.success(`${label} copiado com sucesso`))
    .catch(() => toast.error("Não foi possível copiar"));
}

function IdeiaCard({
  ideia, selecionada, parecidasAbertas, parecidas, onSelect, onGerarParecidas, onUsarParecida,
}: {
  ideia: IdeiaIA;
  selecionada: boolean;
  parecidasAbertas: boolean;
  parecidas: IdeiaIA[];
  onSelect: () => void;
  onGerarParecidas: () => void;
  onUsarParecida: (p: IdeiaIA) => void;
}) {
  const hashtagsStr = Array.isArray(ideia.hashtags) ? ideia.hashtags.join(" ") : String(ideia.hashtags ?? "");
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-[var(--shadow-soft)] transition ${selecionada ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
    >
      <button onClick={onSelect} className="flex flex-col gap-3 text-left">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
          {ideia.formatoRecomendado}
        </span>
        <h3 className="text-sm font-semibold leading-snug">{ideia.titulo}</h3>
        <p className="text-xs text-muted-foreground">{ideia.explicacao}</p>
        <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground line-clamp-4 whitespace-pre-line">
          {ideia.legenda}
        </div>
        <p className="text-[11px] text-primary">{hashtagsStr}</p>
        {ideia.cta && <p className="text-[11px] text-foreground"><strong>CTA:</strong> {ideia.cta}</p>}
        {ideia.motivoDaIdeia && <p className="text-[11px] text-muted-foreground italic">{ideia.motivoDaIdeia}</p>}
      </button>
      <div className="mt-1 flex flex-wrap gap-2">
        <button onClick={onSelect}
          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          Usar essa ideia
        </button>
        <button onClick={onGerarParecidas}
          className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:border-primary/40">
          Gerar outra parecida
        </button>
      </div>

      {parecidasAbertas && parecidas.length > 0 && (
        <div className="mt-3 space-y-3 border-t border-dashed border-border pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Ideias parecidas</p>
          {parecidas.map((p, idx) => {
            const hs = Array.isArray(p.hashtags) ? p.hashtags.join(" ") : String(p.hashtags ?? "");
            return (
              <div key={idx} className="rounded-xl border border-border bg-background p-3">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  {p.formatoRecomendado}
                </span>
                <h4 className="mt-2 text-xs font-semibold">{p.titulo}</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">{p.explicacao}</p>
                <p className="mt-2 whitespace-pre-line rounded-md bg-muted p-2 text-[11px] text-muted-foreground line-clamp-3">{p.legenda}</p>
                <p className="mt-1 text-[10px] text-primary">{hs}</p>
                <div className="mt-2">
                  <button onClick={() => { onUsarParecida(p); toast.success("Ideia selecionada"); }}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                    Usar essa ideia
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepWrap({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" }) {
  const cls = variant === "primary"
    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]"
    : "border border-border bg-card text-foreground hover:border-primary/40";
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${cls}`}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pendente": "bg-muted text-muted-foreground",
    "Em produção": "bg-warning/20 text-warning-foreground",
    "Pronto": "bg-success/20 text-success-foreground",
    "Pronto para postar": "bg-success/20 text-success-foreground",
    "Publicado": "bg-primary/15 text-primary",
    "Ideia": "bg-accent text-accent-foreground",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

function ContinuarBar({ onContinuar }: { onContinuar: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onContinuar}
        className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)]"
      >
        Continuar para cronograma <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Observacao({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}

function ConteudoFoto({ ideia, onSalvar, onContinuar }: { ideia: IdeiaIA; onSalvar: () => void; onContinuar: () => void }) {
  const hashtagsStr = Array.isArray(ideia.hashtags) ? ideia.hashtags.join(" ") : "";
  const sugestaoFoto = "Imagem em alta qualidade que represente bem o tema escolhido. Foco no detalhe que prende o olhar, com boa iluminação e fundo limpo.";
  return (
    <div className="space-y-4">
      <Card title="Ideia escolhida">{ideia.titulo}</Card>
      <Card title="Sugestão de foto para você produzir">{sugestaoFoto}</Card>
      <Card title="Legenda"><p className="whitespace-pre-line">{ideia.legenda}</p></Card>
      <Card title="Hashtags"><p className="text-primary">{hashtagsStr}</p></Card>
      {ideia.cta && <Card title="Chamada para ação (CTA)">{ideia.cta}</Card>}
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => copy(sugestaoFoto, "Sugestão de foto")}><Copy className="h-4 w-4" />Copiar sugestão de foto</Button>
        <Button variant="ghost" onClick={() => copy(ideia.legenda, "Legenda")}><Copy className="h-4 w-4" />Copiar legenda</Button>
        <Button variant="ghost" onClick={() => copy(hashtagsStr, "Hashtags")}><Copy className="h-4 w-4" />Copiar hashtags</Button>
        <Button variant="ghost" onClick={onSalvar}><Calendar className="h-4 w-4" />Salvar no cronograma</Button>
      </div>
      <ContinuarBar onContinuar={onContinuar} />
    </div>
  );
}

function ConteudoCarrossel({ ideia, data, loading, onSalvar, onContinuar }: {
  ideia: IdeiaIA;
  data: { tituloCarrossel: string; estruturaCarrossel: Array<{ slide: number; texto: string; orientacaoVisual?: string }>; legenda: string; hashtags: string[] } | null;
  loading: boolean;
  onSalvar: () => void;
  onContinuar: () => void;
}) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando estrutura do carrossel…
      </div>
    );
  }
  const slidesTexto = data.estruturaCarrossel.map((s) => `Slide ${s.slide}: ${s.texto}`).join("\n");
  const hashtagsStr = data.hashtags.join(" ");
  return (
    <div className="space-y-4">
      <Card title="Ideia escolhida">{ideia.titulo}</Card>
      <Card title={data.tituloCarrossel ?? "Estrutura dos slides"}>
        <ol className="space-y-2">
          {data.estruturaCarrossel.map((s) => (
            <li key={s.slide} className="flex gap-3 rounded-lg border border-border bg-background p-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{s.slide}</span>
              <div>
                <p>{s.texto}</p>
                {s.orientacaoVisual && <p className="mt-1 text-xs text-muted-foreground">📸 {s.orientacaoVisual}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Legenda"><p className="whitespace-pre-line">{data.legenda}</p></Card>
      <Card title="Hashtags"><p className="text-primary">{hashtagsStr}</p></Card>
      <Observacao>Use essa estrutura para montar seu carrossel no Canva, CapCut, Photoshop ou editor de sua preferência.</Observacao>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => copy(slidesTexto, "Estrutura do carrossel")}><Copy className="h-4 w-4" />Copiar estrutura do carrossel</Button>
        <Button variant="ghost" onClick={() => copy(data.legenda, "Legenda")}><Copy className="h-4 w-4" />Copiar legenda</Button>
        <Button variant="ghost" onClick={() => copy(hashtagsStr, "Hashtags")}><Copy className="h-4 w-4" />Copiar hashtags</Button>
        <Button variant="ghost" onClick={onSalvar}><Calendar className="h-4 w-4" />Salvar no cronograma</Button>
      </div>
      <ContinuarBar onContinuar={onContinuar} />
    </div>
  );
}

function ConteudoVideo({ ideia, data, loading, onSalvar, onContinuar }: {
  ideia: IdeiaIA;
  data: { tituloVideo: string; tipoVideo: string; duracaoRecomendada: string; roteiroVideo: Array<{ cena: number; instrucaoDeGravacao: string; textoNaTela: string; falaOuLegenda?: string }>; legenda: string; hashtags: string[] } | null;
  loading: boolean;
  onSalvar: () => void;
  onContinuar: () => void;
}) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando roteiro do vídeo…
      </div>
    );
  }
  const roteiroTexto = data.roteiroVideo
    .map((r) => `Cena ${r.cena}: ${r.instrucaoDeGravacao}\nTexto na tela: "${r.textoNaTela}"${r.falaOuLegenda ? `\nFala: ${r.falaOuLegenda}` : ""}`)
    .join("\n\n");
  const hashtagsStr = data.hashtags.join(" ");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card title="Ideia escolhida">{ideia.titulo}</Card>
        <Card title="Tipo de vídeo recomendado">{data.tipoVideo}</Card>
        <Card title="Duração recomendada">{data.duracaoRecomendada}</Card>
      </div>
      <Card title="Passo a passo para gravar">
        <ol className="space-y-2">
          {data.roteiroVideo.map((r) => (
            <li key={r.cena} className="rounded-lg border border-border bg-background p-3 text-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">Cena {r.cena}</div>
              <div className="mt-1">{r.instrucaoDeGravacao}</div>
              <div className="mt-1 text-xs text-muted-foreground">Texto na tela: "{r.textoNaTela}"</div>
              {r.falaOuLegenda && <div className="mt-1 text-xs text-muted-foreground">Fala/legenda: {r.falaOuLegenda}</div>}
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Legenda"><p className="whitespace-pre-line">{data.legenda}</p></Card>
      <Card title="Hashtags"><p className="text-primary">{hashtagsStr}</p></Card>
      <Observacao>Use esse roteiro para gravar e editar o vídeo no CapCut, Instagram ou editor de sua preferência.</Observacao>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => copy(roteiroTexto, "Roteiro")}><Copy className="h-4 w-4" />Copiar roteiro</Button>
        <Button variant="ghost" onClick={() => copy(data.legenda, "Legenda")}><Copy className="h-4 w-4" />Copiar legenda</Button>
        <Button variant="ghost" onClick={() => copy(hashtagsStr, "Hashtags")}><Copy className="h-4 w-4" />Copiar hashtags</Button>
        <Button variant="ghost" onClick={onSalvar}><Calendar className="h-4 w-4" />Salvar no cronograma</Button>
      </div>
      <ContinuarBar onContinuar={onContinuar} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
