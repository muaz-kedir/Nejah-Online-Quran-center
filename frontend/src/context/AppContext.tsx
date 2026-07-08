import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en';

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

};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLanguageState((localStorage.getItem('language') as Language) || 'en');
      setSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
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
