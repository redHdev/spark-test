import { createContext, useContext, useState } from 'react';
import {
  IconDeviceMobileMessage,
  IconBook,
  IconFlask
} from '@tabler/icons-react';

type NavContextType = {
  activeComponent: string;
  setActiveComponent: React.Dispatch<React.SetStateAction<string>>;
  openSettings: boolean;
  setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>;
  openFiles: boolean;
  setOpenFiles: React.Dispatch<React.SetStateAction<boolean>>;
  openMods: boolean;
  setOpenMods: React.Dispatch<React.SetStateAction<boolean>>;
  openLab: boolean;
  setOpenLab: React.Dispatch<React.SetStateAction<boolean>>;
  openConvos: boolean;
  setOpenConvos: React.Dispatch<React.SetStateAction<boolean>>;
  setCharSwitch: React.Dispatch<React.SetStateAction<boolean>>;
  charSwitch: boolean;
  openCompanions: boolean;
  setOpenCompanions: React.Dispatch<React.SetStateAction<boolean>>;
  data: {
    component: string;
    label: string;
    icon: any;
    dev: boolean;
  }[];
};

const NavContext = createContext<NavContextType | undefined>(undefined);

type NavProviderProps = {
  children: React.ReactNode;
};

export const useActiveComponent = () => {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error("useActiveComponent must be used within a NavProvider");
  }
  return context;
};

export const NavProvider: React.FC<NavProviderProps> = ({ children }) => {
  const [activeComponent, setActiveComponent] = useState<string>('Companions');
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [openFiles, setOpenFiles] = useState<boolean>(false);
  const [charSwitch, setCharSwitch] = useState<boolean>(false);
  const [openMods, setOpenMods] = useState<boolean>(false);
  const [openLab, setOpenLab] = useState<boolean>(false);
  const [openConvos, setOpenConvos] = useState<boolean>(false);
  const [openCompanions, setOpenCompanions] = useState<boolean>(false);

  const data = [
    { component: 'Companions', label: 'SparkGPT', icon: IconDeviceMobileMessage, dev: false },
    { component: 'Library', label: 'Library', icon: IconBook, dev: false },
    { component: 'Laboratory', label: 'Laboratory', icon: IconFlask, dev: false  },
  ];

  return (
    <NavContext.Provider value={{ activeComponent, setOpenLab, openLab, charSwitch, setCharSwitch, setActiveComponent, openSettings, setOpenSettings, openFiles, setOpenFiles, openMods, setOpenMods, openConvos, setOpenConvos, openCompanions, setOpenCompanions, data }}>
      {children}
    </NavContext.Provider>
  );
};
