// Error reporting (Lovable dependency removed — replace with your own if needed)
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[Error Boundary]", error, context);
}
