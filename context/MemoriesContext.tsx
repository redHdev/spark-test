// MemoriesContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CompanionContextType {
  selectedCompanion: any;
  setSelectedCompanion: React.Dispatch<React.SetStateAction<any>>;
  showTextEditor: boolean;
  setShowTextEditor: React.Dispatch<React.SetStateAction<boolean>>;
  showFiles: boolean;
  setShowFiles: React.Dispatch<React.SetStateAction<boolean>>;
  showPrompts: boolean;
  setShowPrompts: React.Dispatch<React.SetStateAction<boolean>>;
  showCompanions: boolean;
  setShowCompanions: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMemory: any;
  setSelectedMemory: React.Dispatch<React.SetStateAction<any>>;
  memoryUploads: string[];
  setMemories: React.Dispatch<React.SetStateAction<string[]>>;
  pfpUploads: string;
  setPfp: React.Dispatch<React.SetStateAction<string>>;
  isFileDropzoneOpen: boolean;
  setIsFileDropzoneOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isImgDropzoneOpen: boolean;
  setIsImgDropzoneOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CompanionContext = createContext<CompanionContextType | undefined>(undefined);

export const useCompanion = () => {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error('useMemories must be used within a MemoriesProvider');
  }
  return context;
};

interface CompanionProviderProps {
  children: ReactNode;
}

export const CompanionProvider: React.FC<CompanionProviderProps> = ({ children }) => {
  const [selectedCompanion, setSelectedCompanion] = useState<any>(null);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showCompanions, setShowCompanions] = useState(false);
  const [isFileDropzoneOpen, setIsFileDropzoneOpen] = useState(false);
  const [isImgDropzoneOpen, setIsImgDropzoneOpen] = useState(false);
  const [memoryUploads, setMemories] = useState<string[]>([]);
  const [pfpUploads, setPfp] = useState<string>('');

  const value = {
    selectedCompanion,
    setSelectedCompanion,
    showTextEditor,
    setShowTextEditor,
    showFiles,
    setShowFiles,
    showPrompts,
    setShowPrompts,
    showCompanions,
    setShowCompanions,
    selectedMemory,
    setSelectedMemory,
    memoryUploads,
    setMemories,
    pfpUploads,
    setPfp,
    isFileDropzoneOpen,
    setIsFileDropzoneOpen,
    isImgDropzoneOpen,
    setIsImgDropzoneOpen,
  };

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
};

export default CompanionContext;
