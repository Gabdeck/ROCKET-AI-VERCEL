import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FolderOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meus-conteudos")({
  head: () => ({ meta: [{ title: "Meus Conteúdos — RocketAI" }] }),
  component: MeusConteudos,
});

const TABS = ["Todos", "Ideia", "Em produção", "Pronto para postar", "Publicado"];

type Conteudo = {
  id: string;
  titulo: string | null;
  formato: string | null;
  status: string;
  tema: string | null;
  origem: string | null;
  created_at: string;
};

function MeusConteudos() {
  const { user } = useAuth();
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Todos");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("conteudos")
        .select("id,titulo,formato,status,tema,origem,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (error) return toast.error("Não foi possível carregar seus conteúdos.");
      setConteudos((data ?? []) as Conteudo[]);
    })();
  }, [user]);


  const filtrados = useMemo(() => {
    if (tab === "Todos") return conteudos;
    return conteudos.filter((c) => (c.status ?? "").toLowerCase() === tab.toLowerCase());
  }, [conteudos, tab]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Meus Conteúdos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Posts, ideias, carrosséis e roteiros salvos.</p>
          </div>
          <Link to="/gerador" className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)]">
            <Plus className="h-4 w-4" /> Novo conteúdo
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${tab === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando…
          </div>
        )}

        {!loading && filtrados.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nenhum conteúdo salvo ainda. Use o gerador para criar e salvar.
          </div>
        )}

        {!loading && filtrados.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="grid h-32 place-items-center rounded-xl bg-[image:var(--gradient-hero)]">
                  <FolderOpen className="h-7 w-7 text-primary" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex w-fit items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                    {c.formato ?? "Conteúdo"}
                  </span>
                  {c.origem && (
                    <span className="inline-flex w-fit items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {c.origem}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold leading-snug">{c.titulo ?? c.tema ?? "(sem título)"}</h3>
                {c.tema && <p className="text-xs text-muted-foreground">Tema: {c.tema}</p>}
                <div className="flex items-center justify-between">
                  <Status status={c.status} />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Status({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Ideia": "bg-accent text-accent-foreground",
    "ideia": "bg-accent text-accent-foreground",
    "Em produção": "bg-warning/20 text-warning-foreground",
    "Pronto para postar": "bg-success/20 text-success-foreground",
    "Publicado": "bg-primary/15 text-primary",
  };
  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
