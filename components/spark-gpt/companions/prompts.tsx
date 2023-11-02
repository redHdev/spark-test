import React, { useState, useEffect } from 'react';
import { Flex, Select, Text, Textarea, ActionIcon, Loader, Tooltip, ScrollArea } from '@mantine/core';
import { IconScriptPlus, IconTrash, IconArrowBack } from '@tabler/icons-react';
import { useCompanion } from '../../../context/MemoriesContext';
import { dropdownNames, dropdownOptions, textareaLabels, DropdownName } from './prompt-presets';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const PromptsComponent: React.FC = () => {
  const { setShowPrompts, selectedCompanion } = useCompanion();
  const supabaseClient = useSupabaseClient();
  const companionId = selectedCompanion.companion_id;
  const [texts, setTexts] = useState(['', '', '']);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedTextarea, setSelectedTextarea] = useState<DropdownName | null>('Intro');
  const [isSaving, setIsSaving] = useState(false);

  const maxCharLimit = 300;

  const updateCompanionInSupabase = async (intros: string, characters: string, extras: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('companions')
        .update({
          intros: intros,
          characters: characters,
          extras: extras
        })
        .eq('companion_id', companionId);

      if (error) {
        console.error("Error updating Supabase:", error);
      }

      if (data) {
        console.log("Successfully updated!", data);
      }

    } catch (error) {
      console.error("Supabase interaction failed:", error);
    }
  };

  const fetchCompanionData = async (companionId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('companions')
        .select('intros, characters, extras')
        .eq('companion_id', companionId);

      if (error) {
        console.error("Error fetching data from Supabase:", error);
        return null;
      }

      return data ? data[0] : null;

    } catch (error) {
      console.error("Supabase interaction failed:", error);
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      const data = await fetchCompanionData(companionId);
      if (data) {
        setTexts([
          data.intros || '',
          data.characters || '',
          data.extras || ''
        ]);
      }
    })();
  }, []);

const handleDownloadClick = () => {
  if (selectedTextarea !== null && selectedOption) {
    const selectedDropdownOption = dropdownOptions[selectedTextarea].find(opt => opt.name === selectedOption);
    const selectedValue = selectedDropdownOption ? selectedDropdownOption.value : null;

    if (selectedValue) {
      const index = dropdownNames.indexOf(selectedTextarea);
      if (index > -1) {
        setTexts(prev => {
          const newArr = [...prev];
          newArr[index] = selectedValue;
          return newArr;
        });
      }
    }
  }
};

  const handleBackClick = async () => {
      setIsSaving(true);
      try {
          await updateCompanionInSupabase(texts[0], texts[1], texts[2]);
          setShowPrompts(false);

      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteClick = () => {
    if (selectedTextarea !== null) {
      const index = dropdownNames.indexOf(selectedTextarea);
      if (index > -1) {
        setTexts(prev => {
          const newArr = [...prev];
          newArr[index] = '';
          return newArr;
        });
      }
      setSelectedOption(null);
    }
  };

  return (
    <div>
      <Flex style={{ alignItems: 'center', marginBottom: '20px', marginTop:'4vh' }}>
      {isSaving ? (
        <Loader color="gray" size="sm" style={{marginRight:'4px', transform:'translateY(3px)'}}/>
      ) : (
        <ActionIcon variant="default" size="md" onClick={handleBackClick} style={{transform:'translateY(3px)', padding:'3px'}}>
          <Tooltip label="Back"><IconArrowBack /></Tooltip>
        </ActionIcon>
      )}
        {selectedTextarea !== null && (
          <Select
            key={selectedTextarea}
            data={selectedTextarea && dropdownOptions[selectedTextarea].map(opt => opt.name)}
            placeholder={dropdownNames[dropdownNames.indexOf(selectedTextarea as DropdownName)]}
            value={selectedOption}
            onChange={(value) => setSelectedOption(value)}
            style={{ marginLeft: '10px' }}
          />
        )}
        <ActionIcon variant="default" onClick={handleDownloadClick} style={{marginLeft:'4px'}}>
          <IconScriptPlus
            style={{ cursor: 'pointer' }}
          />
        </ActionIcon>
        <ActionIcon variant="default" onClick={handleDeleteClick}>
          <IconTrash />
        </ActionIcon>
      </Flex>

      <ScrollArea style={{height:'70vh'}} scrollbarSize={4} scrollHideDelay={0}>
      {textareaLabels.map((labelObj, index) => (
        <Flex
          direction="column"
          style={{
            marginBottom: '20px',
            border: selectedTextarea === labelObj.key ? '1px solid #A5CCEA' : '1px solid rgba(160,160,160,0.2)',
            padding: '10px',
            borderRadius: '5px',
            cursor:'pointer'
          }}
          onClick={() => setSelectedTextarea(labelObj.key as DropdownName)}
          key={labelObj.key}
        >
          <Text>{labelObj.main}</Text>
          <Text size="xs" style={{ opacity: 0.75, marginBottom: '10px' }}>{labelObj.sub}</Text>
          <Textarea
            value={texts[index]}
            onChange={(e) => {
              const newText = e.currentTarget.value;
              if (newText.length <= maxCharLimit) {
                setTexts(prev => {
                  const newArr = [...prev];
                  newArr[index] = newText;
                  return newArr;
                });
              }
            }}
            onFocus={() => setSelectedTextarea(labelObj.key as DropdownName)}
            style={{
              marginTop: '10px'
            }}
            minRows={6}
          />
          <Text style={{ marginTop: '10px', opacity:'0.75' }} size="xs">
            {`${maxCharLimit - (texts[index] ? texts[index].length : 0)}/${maxCharLimit} characters left`}
          </Text>
        </Flex>
      ))}
      </ScrollArea>
    </div>
  );
};

export default PromptsComponent;
