import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sidebar_collapsed';

export function useSidebar() {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState(prev => !prev);
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return {
    collapsed,
    setCollapsed: setCollapsedState,
    toggleCollapsed,
    mobileOpen,
    openMobile,
    closeMobile,
  };
}
