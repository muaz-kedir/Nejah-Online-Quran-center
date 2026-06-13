import { QuranLevel } from '../../students/entities/student.entity';

export type LearningTrack = 'qaidah' | 'quran_reading' | 'tajweed' | 'hifz';

export interface CurriculumTopic {
  id: string;
  order: number;
  nameEn: string;
  nameAr: string;
}

export const QAIDAH_LESSONS: CurriculumTopic[] = [
  { id: 'qaidah-1', order: 1, nameEn: 'Huruf Al-Hijaa Al-Mufradah', nameAr: 'حروف الهجاء المفردة' },
  {
    id: 'qaidah-2',
    order: 2,
    nameEn: 'Huruf Al-Hijaa Al-Murakkabah',
    nameAr: 'حروف الهجاء المركبة',
  },
  { id: 'qaidah-3', order: 3, nameEn: "Al-Huruf Al-Muqatta'ah", nameAr: 'الحروف المقطعة' },
  { id: 'qaidah-4', order: 4, nameEn: 'Al-Huruf Al-Mutaharrikah', nameAr: 'الحروف المتحركة' },
  { id: 'qaidah-5', order: 5, nameEn: 'Al-Huruf Al-Munawwanah', nameAr: 'الحروف المنونة' },
  {
    id: 'qaidah-6',
    order: 6,
    nameEn: 'Exercises on Harakat and Tanween',
    nameAr: 'تدريبات على الحركات والتنوين',
  },
  {
    id: 'qaidah-7',
    order: 7,
    nameEn: 'Small Alif, Small Ya, and Small Waw',
    nameAr: 'الألف الصغيرة والياء الصغيرة والواو الصغيرة',
  },
  { id: 'qaidah-8', order: 8, nameEn: 'Huruf Al-Madd wal-Leen', nameAr: 'حروف المد واللين' },
  {
    id: 'qaidah-9',
    order: 9,
    nameEn: 'Exercises on Tanween, Madd and Leen',
    nameAr: 'تدريبات على التنوين والمد واللين',
  },
  { id: 'qaidah-10', order: 10, nameEn: 'Sukoon', nameAr: 'السكون' },
  { id: 'qaidah-11', order: 11, nameEn: 'Exercises on Sukoon', nameAr: 'تدريبات على السكون' },
  { id: 'qaidah-12', order: 12, nameEn: 'Shaddah', nameAr: 'الشدة' },
  { id: 'qaidah-13', order: 13, nameEn: 'Exercises on Shaddah', nameAr: 'تدريبات على الشدة' },
  {
    id: 'qaidah-14',
    order: 14,
    nameEn: 'Exercises on Shaddah and Sukoon',
    nameAr: 'تدريبات على الشدة والسكون',
  },
  {
    id: 'qaidah-15',
    order: 15,
    nameEn: 'Exercises on Double Shaddah in Words',
    nameAr: 'تدريبات على الشدتين في كلمة',
  },
  {
    id: 'qaidah-16',
    order: 16,
    nameEn: 'Exercises on Shaddah, Sukoon and Madd',
    nameAr: 'تدريبات على الشدة والسكون مع المد',
  },
  {
    id: 'qaidah-17',
    order: 17,
    nameEn: 'Comprehensive Review Exercises',
    nameAr: 'تدريبات على ما سبق',
  },
];

export const TAJWEED_TOPICS: CurriculumTopic[] = [
  {
    id: 'tajweed-1',
    order: 1,
    nameEn: 'Noon Sakinah Rules',
    nameAr: 'أحكام النون الساكنة والتنوين',
  },
  { id: 'tajweed-2', order: 2, nameEn: 'Meem Sakinah Rules', nameAr: 'أحكام الميم الساكنة' },
  { id: 'tajweed-3', order: 3, nameEn: 'Ghunnah', nameAr: 'الغنة' },
  { id: 'tajweed-4', order: 4, nameEn: 'Ikhfa', nameAr: 'الإخفاء' },
  { id: 'tajweed-5', order: 5, nameEn: 'Idgham', nameAr: 'الإدغام' },
  { id: 'tajweed-6', order: 6, nameEn: 'Iqlab', nameAr: 'الإقلاب' },
  { id: 'tajweed-7', order: 7, nameEn: 'Izhar', nameAr: 'الإظهار' },
  { id: 'tajweed-8', order: 8, nameEn: 'Madd Rules', nameAr: 'أحكام المد' },
  { id: 'tajweed-9', order: 9, nameEn: 'Qalqalah', nameAr: 'القلقلة' },
  { id: 'tajweed-10', order: 10, nameEn: 'Waqf Rules', nameAr: 'أحكام الوقف والابتداء' },
];

export function resolveLearningTrack(level?: string | null): LearningTrack {
  switch (level) {
    case QuranLevel.QAIDA_NOORANIYA:
      return 'qaidah';
    case QuranLevel.TAJWEED_PROGRAM:
      return 'tajweed';
    case QuranLevel.HIFZ_PROGRAM:
    case QuranLevel.HIFZ_MURAJAA:
      return 'hifz';
    case QuranLevel.QURAN_READING:
    default:
      return 'quran_reading';
  }
}

export function getTopicsForTrack(track: LearningTrack): CurriculumTopic[] {
  switch (track) {
    case 'qaidah':
      return QAIDAH_LESSONS;
    case 'tajweed':
      return TAJWEED_TOPICS;
    default:
      return [];
  }
}

export function getTopicById(track: LearningTrack, topicId: string): CurriculumTopic | undefined {
  return getTopicsForTrack(track).find((t) => t.id === topicId);
}

export function getNextTopic(track: LearningTrack, completedIds: string[]): CurriculumTopic | null {
  const topics = getTopicsForTrack(track);
  if (!topics.length) return null;
  const next = topics.find((t) => !completedIds.includes(t.id));
  return next || topics[topics.length - 1];
}

export function formatTopicLabel(topic: CurriculumTopic): string {
  return `${topic.nameEn} (${topic.nameAr})`;
}

export function getTrackLabel(track: LearningTrack): string {
  const labels: Record<LearningTrack, string> = {
    qaidah: 'Qaidah Nooraniyah',
    quran_reading: 'Quran Reading',
    tajweed: 'Tajweed Program',
    hifz: 'Hifz Program',
  };
  return labels[track];
}
