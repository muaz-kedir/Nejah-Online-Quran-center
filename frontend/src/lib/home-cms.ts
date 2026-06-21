import { apiUrl, apiAssetUrl } from './api';

export type CmsLang = 'en' | 'ar' | 'am';

export type LocalizedText = Record<CmsLang, string>;

export function pickLocalized(text: LocalizedText | null | undefined, lang: CmsLang): string {
  if (!text) return '';
  return text[lang]?.trim() || text.en?.trim() || text.ar?.trim() || text.am?.trim() || '';
}

export function resolveCmsImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads')) return apiAssetUrl(path);
  return path;
}

export type HomeMissionSection = {
  id: string;
  aboutHeader: LocalizedText;
  aboutDescription: LocalizedText;
  missionTitle: LocalizedText;
  missionHeading: LocalizedText;
  missionDescription: LocalizedText;
  missionImageUrl: string | null;
};

export type HomeMissionCard = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type HomeProgramsSection = {
  id: string;
  sectionHeader: LocalizedText;
  mainTitle: LocalizedText;
  description: LocalizedText;
};

export type HomeProgram = {
  id: string;
  level: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export async function fetchPublicMissionContent() {
  const res = await fetch(apiUrl('/website/home/mission'));
  if (!res.ok) throw new Error('Failed to load mission content');
  return res.json() as Promise<{ section: HomeMissionSection; cards: HomeMissionCard[] }>;
}

export async function fetchPublicProgramsContent() {
  const res = await fetch(apiUrl('/website/home/programs'));
  if (!res.ok) throw new Error('Failed to load programs content');
  return res.json() as Promise<{ section: HomeProgramsSection; programs: HomeProgram[] }>;
}

export async function uploadCmsImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('token');
  const res = await fetch(apiUrl('/uploads'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Image upload failed');
  }
  const data = await res.json();
  return data.url as string;
}

export const EMPTY_LOCALIZED: LocalizedText = { en: '', ar: '', am: '' };
