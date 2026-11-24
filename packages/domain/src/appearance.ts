export const themes = ["original", "christmas", "new-year"] as const;
export type Theme = typeof themes[number];
export type Appearance = { theme: Theme };
export function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}
export function parseAppearance(value: unknown): Appearance {
  if (!value || typeof value !== "object" || !("theme" in value) || !isTheme(value.theme)) {
    throw new Error("Escolha Original, Natal ou Ano Novo.");
  }
  return { theme: value.theme };
}
