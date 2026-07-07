import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ar' | 'fr' | 'am' | 'om';

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
  myClasses: string;
  myProgress: string;
  homework: string;
  resources: string;
  logout: string;
  loading: string;
  studentPortal: string;
  notifications: string;
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
    myClasses: 'My Classes',
    myProgress: 'My Progress',
    homework: 'Homework',
    resources: 'Resources',
    logout: 'Logout',
    loading: 'Loading...',
    studentPortal: 'Student Portal',
    notifications: 'Notifications',
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
    myClasses: 'فصولي',
    myProgress: 'تقدمي',
    homework: 'الواجبات',
    resources: 'الموارد',
    logout: 'تسجيل خروج',
    loading: 'جارٍ التحميل...',
    studentPortal: 'بوابة الطالب',
    notifications: 'الإشعارات',
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
    myClasses: 'Mes Cours',
    myProgress: 'Ma Progression',
    homework: 'Devoirs',
    resources: 'Ressources',
    logout: 'Déconnexion',
    loading: 'Chargement...',
    studentPortal: 'Portail Étudiant',
    notifications: 'Notifications',
  },
  am: {
    dashboard: 'ዳሽቦርድ',
    students: 'ተማሪዎች',
    teachers: 'አስተማሪዎች',
    parents: 'ወላጆች',
    classes: 'ክፍሎች',
    attendance: 'መገኘት',
    reports: 'ሪፖርቶች',
    settings: 'ቅንብሮች',
    messages: 'መልዕክቶች',
    contentEdition: 'የይዘት አርትዖት',
    searchPlaceholder: 'በኮንሶል ውስጥ ፈልግ...',
    managementOverview: 'የአስተዳደር አጠቃላይ እይታ',
    greeting: 'እንኳን ደህና መጡ',
    welcomeMessage: 'እንኳን ወደ ኔጃህ የመስመር ላይ ቁርአን ማዕከል በደህና መጡ። ተቋማችን በአሁኑ ጊዜ 1,240 ንቁ ተማሪዎችን ያገለግላል።',
    totalStudents: 'ጠቅላላ ተማሪዎች',
    totalTeachers: 'ጠቅላላ አስተማሪዎች',
    activeClasses: 'ንቁ ክፍሎች',
    attendanceRate: 'የመገኘት መጠን',
    recentStudents: 'የቅርብ ጊዜ ተማሪዎች',
    viewAll: 'ሁሉንም ተማሪዎች ይመልከቱ',
    todaysClasses: 'የዛሬ ክፍሎች',
    staffOverview: 'የሰራተኞች አጠቃላይ እይታ',
    systemAlerts: 'የስርዓት ማንቂያዎች',
    viewAllNotifications: 'ሁሉንም ማሳወቂያዎች ይመልከቱ',
    manageAllStaff: 'ሁሉንም ሰራተኞች ያስተዳድሩ',
    myClasses: 'ክፍሎቼ',
    myProgress: 'እድገቴ',
    homework: 'የቤት ስራ',
    resources: 'መርጃዎች',
    logout: 'ውጣ',
    loading: 'በመጫን ላይ...',
    studentPortal: 'የተማሪ ፖርታል',
    notifications: 'ማሳወቂያዎች',
  },
  om: {
    dashboard: 'Daashboordii',
    students: 'Barattoota',
    teachers: 'Barsiistota',
    parents: 'Matayya',
    classes: 'Kutaa',
    attendance: 'Argamuu',
    reports: 'Gabaasa',
    settings: 'Saajjattoo',
    messages: 'Ergaa',
    contentEdition: 'Gulaallii Qabiyyee',
    searchPlaceholder: 'Konsoolii keessa barbaadi...',
    managementOverview: 'ARGAMA BULCHIINSA WALIGALAA',
    greeting: 'Baga nagaan dhufte',
    welcomeMessage: 'Baga nagaan gara Nejah Online Quran Center dhufte. Dhaabbiin kee amma barattoota socho\'aa 1,240 tajaajila.',
    totalStudents: 'Barattoota Waligalaa',
    totalTeachers: 'Barsiistota Waligalaa',
    activeClasses: 'Kutaa Socho\'aa',
    attendanceRate: 'Hamma Argamuu',
    recentStudents: 'Barattoota Dhihootti',
    viewAll: 'Barattoota hunda laali',
    todaysClasses: 'Kutaa Har\'aa',
    staffOverview: 'Argama Hooggansa',
    systemAlerts: 'Hubachiisa Sirnaa',
    viewAllNotifications: 'BEKSIISA HUNDA LAALI',
    manageAllStaff: 'HOOGGANSA HUNDA BULCHI',
    myClasses: 'Kutaa Koo',
    myProgress: 'Fayyaa Koo',
    homework: 'Hoji Manaa',
    resources: 'Qabeenya',
    logout: 'Ba\u2019i',
    loading: 'Fe\'aa jira...',
    studentPortal: 'Balbala Barataa',
    notifications: 'Beeksisa',
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

  // Only set initial values on client side to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTheme((localStorage.getItem('theme') as Theme) || 'light');
      setLanguageState((localStorage.getItem('language') as Language) || 'en');
      setSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
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
