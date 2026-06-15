import { MessageCircle, Send } from "lucide-react";

export function ChatField({
  title = "Quer explicar melhor o que você precisa?",
  placeholder,
  value,
  onChange,
  onSubmit,
  submitLabel = "Enviar",
}: {
  title?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: (v: string) => void;
  submitLabel?: string;
}) {
  const v = value ?? "";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageCircle className="h-4 w-4 text-primary" />
        {title}
      </label>
      <textarea
        value={v}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      {onSubmit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => v.trim() && onSubmit(v.trim())}
            disabled={!v.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
