import { createContext, useContext, useEffect, useState } from 'react';

import { BackendModesType, BackendCompanionsType, ShowConversationComponentType } from '../types/promptConfig';

interface PromptConfigType {
    backendMods?: BackendModesType | null;
    backendCompanions?: BackendCompanionsType | null;
    showConversationComponent?: boolean | null;
}

interface PromptConfigProps {
    promptConfig : PromptConfigType | null;
    setPromptConfig : React.Dispatch<React.SetStateAction<PromptConfigType | null>>;
}

interface PromptProviderProps {
  children: React.ReactNode;
}

const PromptContext = createContext<PromptConfigProps | undefined>(undefined);

export const PromptProvider: React.FC<PromptProviderProps> = ({ children }) => {
  const [promptConfig, setPromptConfig] = useState<PromptConfigType | null>(null);

  return (
    <PromptContext.Provider value={{ promptConfig, setPromptConfig}}>
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const config = useContext(PromptContext);
  if (config === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return config;
}
