export type CmsLang = 'en' | 'ar' | 'am';

export type LocalizedText = Record<CmsLang, string>;

export const EMPTY_LOCALIZED: LocalizedText = { en: '', ar: '', am: '' };

export function pickLocalized(text: LocalizedText | null | undefined, lang: CmsLang): string {
  if (!text) return '';
  return text[lang]?.trim() || text.en?.trim() || text.ar?.trim() || text.am?.trim() || '';
}
