const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapes text before it's interpolated into an innerHTML template. Every
 * piece of free text a user can type (diário, nomes de exercícios/
 * habilidades/desafios, notas, etiquetas de refeições) goes through this —
 * without it, a value like `<img src=x onerror=...>` typed into any of
 * those fields would execute in every device the account syncs to.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}
