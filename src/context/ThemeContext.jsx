import { createContext, useContext, useState, useEffect } from 'react';

const THEME_CONTEXT_KEY = '__OpPoThemeContext__';
if (!window[THEME_CONTEXT_KEY]) {
  window[THEME_CONTEXT_KEY] = createContext();
}
const ThemeContext = window[THEME_CONTEXT_KEY];

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false; // Luôn mặc định là sáng (false) nếu chưa lưu
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
