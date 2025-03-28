
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'default' | 'neon' | 'pastel' | 'midnight' | 'sunset';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('default');

  // Apply theme to body element
  useEffect(() => {
    const classList = document.documentElement.classList;
    // Remove existing theme classes
    const themeClasses = ['theme-neon', 'theme-pastel', 'theme-midnight', 'theme-sunset'];
    classList.remove(...themeClasses);
    
    // Add new theme class if not default
    if (theme !== 'default') {
      classList.add(`theme-${theme}`);
    }
    
    // Save to localStorage
    localStorage.setItem('vibe-theme', theme);
  }, [theme]);

  // Load theme from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('vibe-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
