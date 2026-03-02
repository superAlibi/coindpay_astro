import en from './en.json';
import zh from './zh.json';
import th from './th.json';

const SUPPORTED = ['en', 'zh', 'th'] as const;
export type Locale = (typeof SUPPORTED)[number];

function parseAcceptLanguage(header: string | null): { lang: string; q: number }[] {
  if (!header?.trim()) return [];
  return header
    .split(',')
    .map((part) => {
      const [lang, qPart] = part.trim().split(';');
      const q = qPart?.startsWith('q=') ? parseFloat(qPart.slice(2).trim()) : 1;
      const primary = lang?.trim().split('-')[0]?.toLowerCase() ?? '';
      return { lang: primary, q: Number.isNaN(q) ? 1 : q };
    })
    .filter((x) => x.lang.length > 0)
    .sort((a, b) => b.q - a.q);
}

export function getLocaleFromAcceptLanguage(acceptLanguageHeader: string | null): Locale {
  const parsed = parseAcceptLanguage(acceptLanguageHeader);
  for (const { lang } of parsed) {
    if (lang === 'en' || lang === 'zh' || lang === 'th') return lang as Locale;
  }
  return 'en';
}

const messages: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  zh: zh as Record<string, unknown>,
  th: th as Record<string, unknown>
};

function getNested(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(locale: Locale, key: string): string {
  const value = getNested(messages[locale], key);
  if (value !== undefined) return value;
  const fallback = getNested(messages.en, key);
  if (fallback !== undefined) return fallback;
  return key;
}
