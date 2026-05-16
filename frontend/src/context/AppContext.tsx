import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ar' | 'fr';

interface Translations {
  dashboard: string;
  students: string;
  teachers: string;
  parents: string;
  classes: string;
  attendance: string;
  reports: string;
  settings: string;
  messages: string;
  contentEdition: string;
  searchPlaceholder: string;
  managementOverview: string;
  greeting: string;
  welcomeMessage: string;
  totalStudents: string;
  totalTeachers: string;
  activeClasses: string;
  attendanceRate: string;
  recentStudents: string;
  viewAll: string;
  todaysClasses: string;
  staffOverview: string;
  systemAlerts: string;
  viewAllNotifications: string;
  manageAllStaff: string;
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: 'Dashboard',
    students: 'Students',
    teachers: 'Teachers',
    parents: 'Parents',
    classes: 'Classes',
    attendance: 'Attendance',
    reports: 'Reports',
    settings: 'Settings',
    messages: 'Messages',
    contentEdition: 'Content Edition',
    searchPlaceholder: 'Search across console...',
    managementOverview: 'MANAGEMENT OVERVIEW',
    greeting: 'Assalamu Alaikum',
    welcomeMessage: 'Welcome back to the Nejah command center. Your institution currently serves 1,240 active seekers of knowledge.',
    totalStudents: 'Total Students',
    totalTeachers: 'Total Teachers',
    activeClasses: 'Active Classes',
    attendanceRate: 'Attendance Rate',
    recentStudents: 'Recent Students',
    viewAll: 'View All Students',
    todaysClasses: "Today's Classes",
    staffOverview: 'Staff Overview',
    systemAlerts: 'System Alerts',
    viewAllNotifications: 'VIEW ALL NOTIFICATIONS',
    manageAllStaff: 'MANAGE ALL STAFF',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    students: 'الطلاب',
    teachers: 'المعلمون',
    parents: 'أولياء الأمور',
    classes: 'الفصول',
    attendance: 'الحضور',
    reports: 'التقارير',
    settings: 'الإعدادات',
    messages: 'الرسائل',
    contentEdition: 'تحرير المحتوى',
    searchPlaceholder: 'البحث في لوحة التحكم...',
    managementOverview: 'نظرة إدارية عامة',
    greeting: 'السلام عليكم',
    welcomeMessage: 'مرحبًا بعودتك إلى مركز نجاح. يخدم مؤسستك حاليًا 1,240 طالبًا نشطًا.',
    totalStudents: 'إجمالي الطلاب',
    totalTeachers: 'إجمالي المعلمين',
    activeClasses: 'الفصول النشطة',
    attendanceRate: 'معدل الحضور',
    recentStudents: 'الطلاب الأخيرون',
    viewAll: 'عرض كل الطلاب',
    todaysClasses: 'فصول اليوم',
    staffOverview: 'نظرة على الكادر',
    systemAlerts: 'تنبيهات النظام',
    viewAllNotifications: 'عرض كل التنبيهات',
    manageAllStaff: 'إدارة الكادر',
  },
  fr: {
    dashboard: 'Tableau de bord',
    students: 'Étudiants',
    teachers: 'Enseignants',
    parents: 'Parents',
    classes: 'Classes',
    attendance: 'Présence',
    reports: 'Rapports',
    settings: 'Paramètres',
    messages: 'Messages',
    contentEdition: 'Édition de contenu',
    searchPlaceholder: 'Rechercher dans la console...',
    managementOverview: 'APERÇU DE GESTION',
    greeting: 'Assalamu Alaikum',
    welcomeMessage: 'Bienvenue au centre de commande Nejah. Votre institution sert actuellement 1 240 apprenants actifs.',
    totalStudents: 'Total Étudiants',
    totalTeachers: 'Total Enseignants',
    activeClasses: 'Classes Actives',
    attendanceRate: 'Taux de Présence',
    recentStudents: 'Étudiants Récents',
    viewAll: 'Voir tous les étudiants',
    todaysClasses: "Cours d'aujourd'hui",
    staffOverview: 'Aperçu du Personnel',
    systemAlerts: 'Alertes Système',
    viewAllNotifications: 'VOIR TOUTES LES NOTIFICATIONS',
    manageAllStaff: 'GÉRER LE PERSONNEL',
  },
};

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const savedLang = localStorage.getItem('language') as Language | null;
      const savedSidebar = localStorage.getItem('sidebarCollapsed');
      if (savedTheme) setTheme(savedTheme);
      if (savedLang) setLanguageState(savedLang);
      if (savedSidebar) setSidebarCollapsed(savedSidebar === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  const handleSetSidebarCollapsed = (val: boolean) => {
    setSidebarCollapsed(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(val));
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t: translations[language],
        sidebarCollapsed,
        setSidebarCollapsed: handleSetSidebarCollapsed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
