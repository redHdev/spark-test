import React, { createContext, useContext, useState } from 'react';

interface ThemeSwitcherContextProps {
  showThemeSwitcher: boolean;
  setShowThemeSwitcher: React.Dispatch<React.SetStateAction<boolean>>;
  hidePath: string | null;
  setHidePath: React.Dispatch<React.SetStateAction<string | null>>;
}

const ThemeSwitcherContext = createContext<ThemeSwitcherContextProps | undefined>(undefined);

interface ThemeSwitcherProviderProps {
  children: React.ReactNode;
}

export const ThemeSwitcherProvider = ({ children }: ThemeSwitcherProviderProps) => {
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(true);
  const [hidePath, setHidePath] = useState<string | null>(null);

  return (
    <ThemeSwitcherContext.Provider value={{ showThemeSwitcher, setShowThemeSwitcher, hidePath, setHidePath }}>
      {children}
    </ThemeSwitcherContext.Provider>
  );
};

export const useThemeSwitcher = (): ThemeSwitcherContextProps => {
  const context = useContext(ThemeSwitcherContext);
  if (!context) {
    throw new Error('useThemeSwitcher must be used within a ThemeSwitcherProvider');
  }
  return context;
};
