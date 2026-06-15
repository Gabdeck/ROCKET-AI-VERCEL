import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, Loader2, MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Entrar — RocketAI" }] }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot" | "verify";

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return "Seu e-mail ainda não foi confirmado. Abra o link que enviamos para sua caixa de entrada para ativar sua conta.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Este e-mail já possui uma conta. Faça login ou recupere sua senha.";
  if (m.includes("password")) return "Senha inválida. Use ao menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("email rate"))
    return "Você solicitou muitos e-mails em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
  return "Não foi possível concluir a ação. Tente novamente.";
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");

  // If user already signed in, send them to the app
  useEffect(() => {
    if (!loading && user) navigate({ to: "/gerador" });
  }, [user, loading, navigate]);

  // Detect email confirmation from the URL hash (Supabase places token in #)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=signup") || hash.includes("type=recovery") || hash.includes("access_token")) {
      // detectSessionInUrl handles parsing; just feedback and clean
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          toast.success("Email confirmado com sucesso.");
          history.replaceState(null, "", window.location.pathname);
          navigate({ to: "/gerador" });
        }
      }, 200);
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed") || msg.includes("email not confirmed")) {
        setVerifyEmail(email);
        setMode("verify");
        return toast.error("Seu email ainda não foi confirmado.");
      }
      return toast.error(friendlyError(error.message));
    }
    toast.success("Login realizado com sucesso.");
    navigate({ to: "/gerador" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmar) return toast.error("As senhas não coincidem.");
    if (senha.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { nome },
      },
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));

    // If session is null → email confirmation required
    if (!data.session) {
      setVerifyEmail(email);
      setMode("verify");
      toast.success("Conta criada. Verifique seu email para ativar o acesso.");
      return;
    }
    toast.success("Conta criada com sucesso.");
    navigate({ to: "/gerador" });
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));
    toast.success("Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.");
    setMode("login");
  }

  async function reenviarConfirmacao(targetEmail: string) {
    if (!targetEmail) return toast.error("Informe seu e-mail.");
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) return toast.error(friendlyError(error.message));
    toast.success("Enviamos um novo link de confirmação para seu e-mail.");
  }

  return (
    <div className="min-h-screen bg-[image:var(--gradient-hero)] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-lift)]">
            <Rocket className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Rocket</span>
            <span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          {mode === "login" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Entre na sua conta</h1>
              <p className="mt-1 text-sm text-muted-foreground">Acesse suas ideias, cronogramas e conteúdos salvos.</p>

              <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
                <p className="text-sm font-semibold">Como acessar sua conta</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Digite o mesmo e-mail e senha usados no cadastro. Se você acabou de criar sua conta, confirme seu e-mail antes de entrar.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-5 space-y-4">
                <Field label="Email" type="email" value={email} onChange={setEmail} required />
                <Field label="Senha" type="password" value={senha} onChange={setSenha} required />
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs font-medium text-primary hover:underline">
                    Esqueci minha senha
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!email) return toast.error("Digite seu e-mail acima para reenviar.");
                      setVerifyEmail(email);
                      reenviarConfirmacao(email);
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Não recebeu o e-mail? Reenviar
                  </button>
                </div>
                <SubmitBtn busy={busy} label="Entrar" />
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">
                  Criar conta
                </button>
              </p>
            </>
          )}

          {mode === "signup" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Criar sua conta</h1>
              <p className="mt-1 text-sm text-muted-foreground">Comece a gerar conteúdo em segundos.</p>
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <Field label="Nome" value={nome} onChange={setNome} required />
                <Field label="Email" type="email" value={email} onChange={setEmail} required />
                <Field label="Senha" type="password" value={senha} onChange={setSenha} required />
                <Field label="Confirmar senha" type="password" value={confirmar} onChange={setConfirmar} required />
                <SubmitBtn busy={busy} label="Criar conta" />
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Já tenho conta.{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                  Entrar
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Recuperar senha</h1>
              <p className="mt-1 text-sm text-muted-foreground">Enviamos um link para você criar uma nova senha.</p>
              <form onSubmit={handleForgot} className="mt-6 space-y-4">
                <Field label="Email" type="email" value={email} onChange={setEmail} required />
                <SubmitBtn busy={busy} label="Enviar link de recuperação" />
              </form>
              <button onClick={() => setMode("login")} className="mt-6 inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para login
              </button>
            </>
          )}

          {mode === "verify" && (
            <>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MailCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Confirme seu e-mail para acessar a RocketAI</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos um link de confirmação para o seu e-mail. Abra sua caixa de entrada e clique no link para ativar sua conta.
              </p>
              <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm">
                <span className="text-muted-foreground">E-mail enviado para: </span>
                <span className="font-semibold">{verifyEmail}</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
                <li>Verifique também a pasta de spam ou promoções.</li>
                <li>O e-mail pode levar alguns minutos para chegar.</li>
                <li>Depois de confirmar, volte para esta página e faça login.</li>
              </ul>
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => setMode("login")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)]"
                >
                  Já confirmei meu e-mail, fazer login
                </button>
                <button
                  onClick={() => reenviarConfirmacao(verifyEmail)}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium hover:border-primary/40 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reenviar e-mail de confirmação
                </button>
                <button
                  onClick={() => setMode("login")}
                  className="inline-flex w-full items-center justify-center gap-1 py-2 text-sm font-semibold text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar para login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type = "text", value, onChange, required,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}

function SubmitBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}
