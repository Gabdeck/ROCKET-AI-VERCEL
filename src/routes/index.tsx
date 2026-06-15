import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ArrowRight, Sparkles, Wand2, Calendar, Video, MessageSquare, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)]">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Assistente de conteúdo para Instagram
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Crie posts para Instagram <br className="hidden sm:block" />
            <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">sem precisar pensar do zero</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Escolha seu nicho, objetivo e formato. O app gera ideias, legendas, hashtags, estruturas de carrossel, roteiros de vídeo e cronogramas para você postar com mais facilidade.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/gerador"
              className="group inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition hover:opacity-95"
            >
              Criar meu primeiro post
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/remix"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)] transition hover:border-primary/40"
            >
              <Wand2 className="h-4 w-4 text-primary" />
              Usar Remix Inteligente
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Sparkles, title: "Ideias prontas", desc: "Sugestões pensadas para seu nicho e objetivo." },
            { icon: MessageSquare, title: "Legendas + hashtags", desc: "Textos prontos para copiar e publicar." },
            { icon: Layers, title: "Estrutura de carrossel", desc: "Slide a slide em texto, pronto para você montar." },
            { icon: Video, title: "Roteiro de vídeo", desc: "Passo a passo para gravar e editar o seu Reels." },
            { icon: Wand2, title: "Remix de referências", desc: "Transforme conteúdos que viralizaram em texto novo." },
            { icon: Calendar, title: "Cronograma semanal", desc: "Organize seu mês inteiro em minutos." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
