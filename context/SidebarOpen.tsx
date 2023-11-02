import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [opened, setOpened] = useState(false);

  const toggleSidebar = () => {
    setOpened(!opened);
  };

  return (
    <SidebarContext.Provider value={{ opened, setOpened, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}
