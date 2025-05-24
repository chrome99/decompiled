import { useEffect, useState } from 'react';

export function useTheme(): string | undefined {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme;
      setTheme(current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

