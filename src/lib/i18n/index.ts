import type { Locale } from "./config";
import { type Dictionary, en } from "./dictionaries/en";
import { mn } from "./dictionaries/mn";

export * from "./config";
export type { Dictionary } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { mn, en };

/**
 * Imported statically rather than with `import()`.
 *
 * Two small dictionaries are cheaper to ship whole than to make every section
 * that needs one `async`; a dynamic import here would also stop the sections
 * that take a dictionary as a prop from being plain Client Components.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/**
 * Fills `{name}` placeholders in a dictionary string.
 *
 * The alternative — splitting a sentence into fragments and concatenating
 * them in JSX — forces the same word order on every language, which is
 * exactly what breaks first when Mongolian puts the count before the noun.
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
