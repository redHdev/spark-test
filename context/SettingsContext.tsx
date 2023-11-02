import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePrompt } from './PromptConfig';

interface SelectedItem {
  xTitle: string;
  xDescription: string;
  xProduct: string;
  xType: string;
  xPrompt: string;
  xIcon: string;
  iconColor: string;
  xAuthor?: string;
  xTags?: string[];
  xLanguage?: string;
  xSecondaryLanguage?: string;
  xEmotion?: string;
  xHardsetOn?: string;
  xTrivia?: string;
  xTriviaOn?: string;
  xImpression?: string;
  xEmojis?: string;
  xAdventure?: string;
  xRiddles?: string;
  xEmotionalSentiment?: string;
  xMaxTokens?: string;
  xTemperature?: string;
  xTriad?: string;
  xModel?: string;
  xPoliticalBias?: string;
  xSarcasm?: string;
  xAscii?: string;
  xRpg?: string;
  xRecipes?: string;
  xNsfw?: string;
  xActions?: string;
}

interface SelectedItemContextProps {
  selectedItem: SelectedItem | null;
  setSelectedItem: (item: SelectedItem) => void;
  setLanguage: (language: string) => void;
  setSecondaryLanguage: (language: string) => void;
  setEmotion: (emotion: string) => void;
  setImpressionReadings: (value: string) => void;
  setForceEmojis: (value: string) => void;
  setRemoveEmojis: (value: string) => void;
  setAdventureMode: (value: string) => void;
  setRiddlesMode: (value: string) => void;
  setEmotionalSentiment: (value: string) => void;
  setAffiliation: (value: string) => void;
  setSarcasm: (value: string) => void;
  setTriad: (value: string) => void;
  setDisagreeableness: (value: string) => void;
  setHardsetOn: (value: string) => void;
  setAscii: (value: string) => void;
  setRpg: (value: string) => void;
  setRecipes: (value: string) => void;
  setNsfw: (value: string) => void;
  setActions: (value: string) => void;
  setTrivia: (emotion: string) => void;
  setTriviaOn: (value: string) => void;
}

const SelectedItemContext = createContext<SelectedItemContextProps | undefined>(undefined);

export const useSelectedItem = () => {
  const context = useContext(SelectedItemContext);
  if (!context) {
    throw new Error('useSelectedItem must be used within a SelectedItemProvider')
  }
  return context;
}

interface SelectedItemProviderProps {
  children: ReactNode;
}


export const SelectedItemProvider: React.FC<SelectedItemProviderProps> = ({ children }) => {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedSecondaryLanguage, setSelectedSecondaryLanguage] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedTrivia, setSelectedTrivia] = useState<string | null>(null);
  const [selectedImpressionReadings, setSelectedImpressionReadings] = useState<string | null>(null);
  const [selectedForceEmojis, setSelectedForceEmojis] = useState<string | null>(null);
  const [selectedRemoveEmojis, setSelectedRemoveEmojis] = useState<string | null>(null);
  const [selectedAdventureMode, setSelectedAdventureMode] = useState<string | null>(null);
  const [selectedRpg, setSelectedRpg] = useState<string | null>(null);
  const [selectedRecipes, setSelectedRecipes] = useState<string | null>(null);
  const [selectedRiddlesMode, setSelectedRiddlesMode] = useState<string | null>(null);
  const [selectedEmotionalSentiment, setSelectedEmotionalSentiment] = useState<string | null>(null);
  const [selectedAffiliation, setSelectedAffiliation] = useState<string | null>(null);
  const [selectedAscii, setSelectedAscii] = useState<string | null>(null);
  const [selectedSarcasm, setSelectedSarcasm] = useState<string | null>(null);
  const [selectedDisagreeableness, setSelectedDisagreeableness] = useState<string | null>(null);
  const [selectedHardsetOn, setSelectedHardsetOn] = useState<string | null>(null);
  const [selectedTriviaOn, setSelectedTriviaOn] = useState<string | null>(null);
  const [selectedTriad, setSelectedTriad] = useState<string | null>(null);
  const [selectedNsfw, setSelectedNsfw] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string | null>(null);

  const user = useUser();
  const supabaseClient = useSupabaseClient();

  const {promptConfig, setPromptConfig} = usePrompt();

  useEffect(() => {
    if ((selectedItem || selectedLanguage || selectedActions || selectedAscii || selectedRpg || selectedTrivia || selectedTriviaOn || selectedNsfw || selectedRecipes || selectedTriad || selectedSecondaryLanguage || selectedRiddlesMode || selectedEmotion || selectedImpressionReadings || selectedRemoveEmojis || selectedForceEmojis || selectedHardsetOn || selectedAdventureMode || selectedEmotionalSentiment || selectedSarcasm || selectedDisagreeableness || selectedAffiliation) && user) {
      const updateCompanions = async () => {
        const { error } = await supabaseClient
          .from('user_mods')
          .update({ companions: JSON.stringify({ ...selectedItem, xRecipes: selectedRecipes, xNsfw: selectedNsfw, xRpg: selectedRpg, xTriad: selectedTriad, xAscii: selectedAscii, xLanguage: selectedLanguage, xRiddles: selectedRiddlesMode, xRemoveEmojis: selectedRemoveEmojis, xHardsetOn: selectedHardsetOn, xSecondaryLanguage: selectedSecondaryLanguage, xEmotion: selectedEmotion, xImpression: selectedImpressionReadings, xEmojis: selectedForceEmojis, xAdventure: selectedAdventureMode, xEmotionalSentiment: selectedEmotionalSentiment, xActions: selectedActions, xTrivia: selectedTrivia, xTriviaOn: selectedTriviaOn, xSarcasm: selectedSarcasm, xDisagreeableness: selectedDisagreeableness, xAffiliation: selectedAffiliation }) })
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to update companions:', error);
        }
      };

      updateCompanions();
      if(promptConfig){
        setPromptConfig({
          ...promptConfig,
          backendMods : {
            ...promptConfig?.backendMods,
            ...selectedItem, 
            xHardsetOn: selectedHardsetOn, 
            xRiddles: selectedRiddlesMode, 
            xRemoveEmojis: selectedRemoveEmojis, 
            xLanguage: selectedLanguage, 
            xSecondaryLanguage: selectedSecondaryLanguage, 
            xEmotion: selectedEmotion, 
            xImpression: selectedImpressionReadings, 
            xEmojis: selectedForceEmojis, 
            xAdventure: selectedAdventureMode, 
            xEmotionalSentiment: selectedEmotionalSentiment, 
            xSarcasm: selectedSarcasm, 
            xActions: selectedActions, 
            xTrivia: selectedTrivia, 
            xTriviaOn: selectedTriviaOn, 
            xRecipes: selectedRecipes, 
            xNsfw: selectedNsfw, 
            xRpg: selectedRpg, 
            xTriad: selectedTriad, 
            xAscii: selectedAscii, 
            xDisagreeableness: selectedDisagreeableness, 
            xAffiliation: selectedAffiliation
          }
        });
      }
      else{
        setPromptConfig({
          backendMods : {
            ...selectedItem, 
            xHardsetOn: selectedHardsetOn, 
            xRiddles: selectedRiddlesMode, 
            xRemoveEmojis: selectedRemoveEmojis, 
            xLanguage: selectedLanguage, 
            xSecondaryLanguage: selectedSecondaryLanguage, 
            xEmotion: selectedEmotion, 
            xImpression: selectedImpressionReadings, 
            xEmojis: selectedForceEmojis, 
            xAdventure: selectedAdventureMode, 
            xEmotionalSentiment: selectedEmotionalSentiment, 
            xSarcasm: selectedSarcasm, 
            xActions: selectedActions, 
            xTrivia: selectedTrivia, 
            xTriviaOn: selectedTriviaOn, 
            xRecipes: selectedRecipes, 
            xNsfw: selectedNsfw, 
            xRpg: selectedRpg, 
            xTriad: selectedTriad, 
            xAscii: selectedAscii, 
            xDisagreeableness: selectedDisagreeableness, 
            xAffiliation: selectedAffiliation
          }
        });
      }
    }
  }, [selectedItem,
    selectedLanguage,
    selectedSecondaryLanguage,
    selectedEmotion,
    selectedTrivia,
    selectedTriad,
    selectedAscii,
    selectedImpressionReadings,
    selectedForceEmojis,
    selectedRemoveEmojis,
    selectedAdventureMode,
    selectedEmotionalSentiment,
    selectedAffiliation,
    selectedRiddlesMode,
    selectedSarcasm,
    selectedRpg,
    selectedDisagreeableness,
    selectedHardsetOn,
    selectedActions,
    selectedTriviaOn,
    selectedNsfw,
    selectedRecipes,
    user,
    supabaseClient]);

  const setLanguage = (language: string) => {
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xLanguage: language,
        };
      }
      return null;
    });
    setSelectedLanguage(language);
  };

  const setSecondaryLanguage = (language: string) => {
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xSecondaryLanguage: language,
        };
      }
      return null;
    });
    setSelectedSecondaryLanguage(language);
  };

  const setEmotion = (emotion: string) => {
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xEmotion: emotion,
        };
      }
      return null;
    });
    setSelectedEmotion(emotion);
  };

  const setTrivia = (value: string) => {
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xTrivia: value,
        };
      }
      return null;
    });
    setSelectedTrivia(value);
  };

  const setTriad = (value: string) => {
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xTriad: value,
        };
      }
      return null;
    });
    setSelectedTriad(value);
  };

  const setImpressionReadings = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xImpression: value,
          };
        }
        return null;
      });
      setSelectedImpressionReadings(value);
    };

  const setForceEmojis = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xEmojis: value,
          };
        }
        return null;
      });
      setSelectedForceEmojis(value);
  };

  const setRemoveEmojis = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xRemoveEmojis: value,
          };
        }
        return null;
      });
      setSelectedRemoveEmojis(value);
  };

  const setAdventureMode = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xAdventure: value,
          };
        }
        return null;
      });
      setSelectedAdventureMode(value);
  };

  const setRecipes = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xRecipes: value,
          };
        }
        return null;
      });
      setSelectedRecipes(value);
  };

  const setRpg = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xRpg: value,
          };
        }
        return null;
      });
      setSelectedRpg(value);
  };

  const setNsfw = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xNsfw: value,
          };
        }
        return null;
      });
      setSelectedNsfw(value);
  };

  const setActions = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xActions: value,
          };
        }
        return null;
      });
      setSelectedActions(value);
  };

  const setAscii = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xAscii: value,
          };
        }
        return null;
      });
      setSelectedAscii(value);
  };

  const setRiddlesMode = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xRiddles: value,
          };
        }
        return null;
      });
      setSelectedRiddlesMode(value);
  };

  const setEmotionalSentiment = (value: string) => {
      setSelectedItem((currentItem) => {
        if (currentItem) {
          return {
            ...currentItem,
            xEmotionalSentiment: value,
          };
        }
        return null;
      });
      setSelectedEmotionalSentiment(value);
  };

  const setAffiliation = (value: string) => {
    setSelectedAffiliation(value);
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xAffiliation: value,
        };
      }
      return null;
    });
  };

  const setSarcasm = (value: string) => {
    setSelectedSarcasm(value);
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xSarcasm: value,
        };
      }
      return null;
    });
  };

  const setDisagreeableness = (value: string) => {
    setSelectedDisagreeableness(value);
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xDisagreeableness: value,
        };
      }
      return null;
    });
  };

  const setHardsetOn = (value: string) => {
    setSelectedHardsetOn(value);
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xHardsetOn: value,
        };
      }
      return null;
    });
  };

  const setTriviaOn = (value: string) => {
    setSelectedTriviaOn(value);
    setSelectedItem((currentItem) => {
      if (currentItem) {
        return {
          ...currentItem,
          xTriviaOn: value,
        };
      }
      return null;
    });
  };

  return (
    <SelectedItemContext.Provider value={{
      selectedItem,
      setSelectedItem,
      setRpg,
      setNsfw,
      setLanguage,
      setSecondaryLanguage,
      setEmotion,
      setHardsetOn,
      setImpressionReadings,
      setForceEmojis,
      setRemoveEmojis,
      setAdventureMode,
      setEmotionalSentiment,
      setTriad,
      setAffiliation,
      setAscii,
      setSarcasm,
      setTrivia,
      setTriviaOn,
      setRiddlesMode,
      setDisagreeableness,
      setRecipes,
      setActions
    }}>
      {children}
    </SelectedItemContext.Provider>
  );
}
