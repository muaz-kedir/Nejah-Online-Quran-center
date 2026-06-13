export interface QuranSurah {
    number: number;
    englishName: string;
    arabicName: string;
    totalAyahs: number;
}
export declare const QURAN_SURAHS: QuranSurah[];
export declare const TOTAL_MUSHAF_PAGES = 604;
export declare function getSurahByNumber(number: number): QuranSurah | undefined;
export declare function formatSurahName(surah: QuranSurah): string;
