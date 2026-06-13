import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'English' | 'Amharic' | 'Oromo';

type TranslationStrings = (typeof translations)[Language];

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  translations: TranslationStrings;
}

const translations = {
  English: {
    dashboard: 'Dashboard',
    myChildren: 'My Children',
    quranProgress: 'Quran Progress',
    attendance: 'Attendance',
    homework: 'Homework',
    examsResults: 'Exams & Results',
    classSchedule: 'Class Schedule',
    recitationAudio: 'Recitation Audio',
    messagesChat: 'Messages / Chat',
    profileSettings: 'Profile Settings',
    search: 'Search curriculum, teachers...',
    totalChildren: 'Total Children',
    activeClasses: 'Active Classes',
    attendanceRate: 'Attendance Rate',
    avgMemorization: 'Avg Memorization',
    pendingHomework: 'Pending HW',
    nextExam: 'Next Exam',
    childrenOverview: 'Children Overview',
    viewAllProfiles: 'View All Profiles',
    teacher: 'Teacher',
    memorization: 'Memorization',
    currentSurah: 'Current Surah',
    attendanceLog: 'Attendance Log',
    progressDetails: 'Progress Details',
    messages: 'Messages',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
  },
  Amharic: {
    dashboard: 'ዳშቦርድ',
    myChildren: 'እናتي የአበራሪዎቻቸው',
    quranProgress: 'ቃራን አጠቃቀም',
    attendance: 'ተፈጥሯል',
    homework: 'እውቅና',
    examsResults: 'ምታ እና ውጤቶች',
    classSchedule: 'ክፍል መስመር',
    recitationAudio: 'ቅራኢት የድምፀ ምን',
    messagesChat: 'መልእኽት / ዳይያሎግ',
    profileSettings: 'መተካት አሰባሰብ',
    search: 'ካሪክኔና የማእከላዊ ዳሰሳዎች...',
    totalChildren: 'አበራሪ አሏቸው',
    activeClasses: 'አክትቭ ክፍሎች',
    attendanceRate: 'ተፈጥሯል አደገፍ',
    avgMemorization: 'መتوسط ሲናዋ',
    pendingHomework: 'መጠጣት አሁንም',
    nextExam: 'ቀጣይ ምት',
    childrenOverview: 'የአበራሪ አጠቃቀም',
    viewAllProfiles: 'ሁሉንም ፕሮፋይሎች ይመልከቱ',
    teacher: 'መምራጥ',
    memorization: 'እውቅና',
    currentSurah: 'አሁን ሲራህ',
    attendanceLog: 'ተፈጥሯል ሩጌ',
    progressDetails: 'አጠቃቀም ይስተሳስቡ',
    messages: 'መልእኽት',
    profile: 'プロフィール',
    settings: '設定',
    logout: ' Logout',
  },
  Oromo: {
    dashboard: 'Daashboorad',
    myChildren: "Waa'raa Lalmee",
    quranProgress: "Qur'aan Aadaa",
    attendance: 'Fama',
    homework: 'Gabaaba',
    examsResults: 'Yeroo fi Nidaa',
    classSchedule: 'Beelmaa Korfaa',
    recitationAudio: 'Recitation Audio',
    messagesChat: 'Oluumi / Chat',
    profileSettings: 'Meeshaa fi Haa',
    search: 'Search curriculum, teachers...',
    totalChildren: 'Total Children',
    activeClasses: 'Active Classes',
    attendanceRate: 'Attendance Rate',
    avgMemorization: 'Avg Memorization',
    pendingHomework: 'Pending HW',
    nextExam: 'Next Exam',
    childrenOverview: 'Children Overview',
    viewAllProfiles: 'View All Profiles',
    teacher: 'Teacher',
    memorization: 'Memorization',
    currentSurah: 'Current Surah',
    attendanceLog: 'Attendance Log',
    progressDetails: 'Progress Details',
    messages: 'Messages',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parentLanguage');
      if (saved) return saved as Language;
    }
    return 'English';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parentLanguage', lang);
      document.documentElement.lang = lang.toLowerCase();
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, translations: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
