import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Redefinir senha — RocketAI" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmar) return toast.error("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setBusy(false);
    if (error) return toast.error("Não foi possível redefinir a senha. Abra o link mais recente enviado para seu e-mail e tente novamente.");
    toast.success("Senha atualizada.");
    navigate({ to: "/gerador" });
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-hero)] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]">
            <Rocket className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Rocket</span>
            <span className="text-primary">AI</span>
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma senha forte para sua conta.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nova senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirmar senha</label>
              <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <button type="submit" disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar nova senha
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
