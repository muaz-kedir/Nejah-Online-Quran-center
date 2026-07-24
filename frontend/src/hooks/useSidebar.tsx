import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sidebar_collapsed';

let globalCollapsed: boolean;
try {
  globalCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
} catch {
  globalCollapsed = false;
}
let globalMobileOpen = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function notify() {
  listeners.forEach(l => l());
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useSidebar() {
  const [, forceUpdate] = useState(0);

  useEffect(() => subscribe(() => forceUpdate(n => n + 1)), []);

  const toggleCollapsed = useCallback(() => {
    globalCollapsed = !globalCollapsed;
    try { localStorage.setItem(STORAGE_KEY, String(globalCollapsed)); } catch {}
    notify();
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    globalCollapsed = value;
    try { localStorage.setItem(STORAGE_KEY, String(globalCollapsed)); } catch {}
    notify();
  }, []);

  const openMobile = useCallback(() => {
    globalMobileOpen = true;
    notify();
  }, []);

  const closeMobile = useCallback(() => {
    globalMobileOpen = false;
    notify();
  }, []);

  return {
    collapsed: globalCollapsed,
    setCollapsed,
    toggleCollapsed,
    mobileOpen: globalMobileOpen,
    openMobile,
    closeMobile,
  };
}
