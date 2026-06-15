import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Save, Link2, Type, Trash2, Plus, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePerfilNegocio } from "@/hooks/use-perfil-negocio";

export const Route = createFileRoute("/_authenticated/meu-negocio")({
  head: () => ({ meta: [{ title: "Meu Negócio — RocketAI" }] }),
  component: MeuNegocio,
});

type Referencia = {
  id: string;
  tipo: "link" | "descricao";
  url: string | null;
  descricao: string | null;
  motivo: string | null;
  resultado: string | null;
};

const CHIPS_MOTIVO = [
  "Teve muitas visualizações",
  "Gerou comentários",
  "Trouxe clientes",
  "Teve muitos salvamentos",
  "Foi engraçado",
  "Mostrou antes e depois",
  "Gerou curiosidade",
  "Teve um gancho forte",
];

function MeuNegocio() {
  const { user } = useAuth();
  const { perfil: perfilSalvo, salvar, saving } = usePerfilNegocio();
  const [perfil, setPerfil] = useState(perfilSalvo);
  const [refs, setRefs] = useState<Referencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkInput, setLinkInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [busy, setBusy] = useState(false);

  // Sincroniza com o perfil salvo no Supabase
  useEffect(() => {
    setPerfil(perfilSalvo);
  }, [perfilSalvo]);

  // Load referencias from supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("referencias_sucesso")
        .select("id,tipo,url,descricao,motivo,resultado")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (error) return toast.error("Não foi possível carregar suas referências.");
      setRefs((data ?? []) as Referencia[]);
    })();
  }, [user]);

  async function salvarPerfil() {
    const { error } = await salvar(perfil);
    if (error) return toast.error("Não foi possível salvar o perfil.");
    toast.success("Perfil do negócio salvo.");
  }

  async function adicionarLink() {
    const url = linkInput.trim();
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      return toast.error("Cole um link válido (começando com http).");
    }
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("referencias_sucesso")
      .insert({ user_id: user.id, tipo: "link", url })
      .select("id,tipo,url,descricao,motivo,resultado")
      .single();
    setBusy(false);
    if (error) return toast.error("Não foi possível adicionar o link.");
    setRefs((r) => [data as Referencia, ...r]);
    setLinkInput("");
    toast.success("Link adicionado.");
  }

  async function adicionarDescricao() {
    const descricao = descInput.trim();
    if (descricao.length < 5) return toast.error("Descreva melhor o conteúdo.");
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("referencias_sucesso")
      .insert({ user_id: user.id, tipo: "descricao", descricao })
      .select("id,tipo,url,descricao,motivo,resultado")
      .single();
    setBusy(false);
    if (error) return toast.error("Não foi possível salvar a descrição.");
    setRefs((r) => [data as Referencia, ...r]);
    setDescInput("");
    toast.success("Descrição adicionada.");
  }

  async function atualizarCampo(id: string, patch: Partial<Referencia>) {
    if (!user) return;
    setRefs((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase
      .from("referencias_sucesso")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) toast.error("Não foi possível salvar.");
  }

  async function remover(id: string) {
    if (!user) return;
    const backup = refs;
    setRefs((r) => r.filter((x) => x.id !== id));
    const { error } = await supabase
      .from("referencias_sucesso")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      setRefs(backup);
      return toast.error("Não foi possível remover.");
    }
    toast.success("Removido.");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Meu Negócio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informações que a IA usa como base para criar conteúdos no seu estilo.
        </p>

        {/* Perfil */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <h2 className="text-lg font-semibold">Perfil de conteúdo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nome do negócio" value={perfil.nome} onChange={(v) => setPerfil({ ...perfil, nome: v })} placeholder="Ex.: Barbearia Premium" />
            <Field label="Nicho principal" value={perfil.nicho} onChange={(v) => setPerfil({ ...perfil, nicho: v })} placeholder="Ex.: Barbearia" />
            <Field label="Tom de voz" value={perfil.tom} onChange={(v) => setPerfil({ ...perfil, tom: v })} placeholder="Ex.: Jovem, descontraído" />
            <Field label="Público-alvo" value={perfil.publico} onChange={(v) => setPerfil({ ...perfil, publico: v })} placeholder="Ex.: Homens 20-40" />
            <Field label="Objetivo principal" value={perfil.objetivo} onChange={(v) => setPerfil({ ...perfil, objetivo: v })} placeholder="Ex.: Atrair clientes locais" />
            <Field label="Instagram" value={perfil.instagram} onChange={(v) => setPerfil({ ...perfil, instagram: v })} placeholder="@seuperfil" />
            <Field label="WhatsApp" value={perfil.whatsapp} onChange={(v) => setPerfil({ ...perfil, whatsapp: v })} placeholder="https://wa.me/55..." />
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={salvarPerfil} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar perfil
            </button>
          </div>
        </section>

        {/* Conteúdos que deram certo */}
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">Conteúdos que deram certo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione posts, Reels ou carrosséis que tiveram bom resultado. A IA usará isso como referência para criar
            conteúdos mais parecidos com o que já funcionou para você.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-primary" /> Colar link do post
              </div>
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Ex: https://www.instagram.com/reel/..."
                className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <button
                onClick={adicionarLink}
                disabled={busy}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Adicionar link
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Type className="h-4 w-4 text-primary" /> Descrever manualmente
              </div>
              <textarea
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Ex: Um Reels mostrando antes e depois de um corte que teve muitas visualizações."
                rows={2}
                className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <button
                onClick={adicionarDescricao}
                disabled={busy}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Adicionar descrição
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="mt-6 space-y-3">
            {loading && (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando referências…
              </div>
            )}
            {!loading && refs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum conteúdo adicionado ainda. Cole um link ou escreva uma descrição acima.
              </div>
            )}
            {refs.map((r) => (
              <ReferenciaCard key={r.id} ref_={r} onChange={atualizarCampo} onRemove={remover} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function ReferenciaCard({
  ref_,
  onChange,
  onRemove,
}: {
  ref_: Referencia;
  onChange: (id: string, patch: Partial<Referencia>) => void;
  onRemove: (id: string) => void;
}) {
  const [motivo, setMotivo] = useState(ref_.motivo ?? "");
  const [resultado, setResultado] = useState(ref_.resultado ?? "");

  const urlCurta = ref_.url ? ref_.url.replace(/^https?:\/\//, "").slice(0, 48) + (ref_.url.length > 55 ? "…" : "") : "";

  function aplicarChip(texto: string) {
    const novo = motivo ? `${motivo} ${texto}` : texto;
    setMotivo(novo);
    onChange(ref_.id, { motivo: novo });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {ref_.tipo === "link" ? <Link2 className="h-3 w-3" /> : <Type className="h-3 w-3" />}
              {ref_.tipo === "link" ? "Link" : "Descrição"}
            </span>
            {ref_.tipo === "link" && ref_.url && (
              <a href={ref_.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary">
                {urlCurta} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {ref_.tipo === "descricao" && (
            <p className="mt-2 text-sm text-foreground">{ref_.descricao}</p>
          )}
        </div>
        <button onClick={() => onRemove(ref_.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remover">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Por que esse conteúdo deu certo?</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            onBlur={() => onChange(ref_.id, { motivo })}
            rows={2}
            placeholder="Ex: Teve muitas visualizações porque mostrou uma transformação forte."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CHIPS_MOTIVO.map((c) => (
              <button
                key={c}
                onClick={() => aplicarChip(c)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Qual foi o resultado?</label>
          <textarea
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            onBlur={() => onChange(ref_.id, { resultado })}
            rows={2}
            placeholder="Ex: 12 mil visualizações, 40 comentários, 5 clientes chamaram no WhatsApp."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}
