import React, { useState, useEffect } from "react";
import { Slider, Switch, Text, Select, Flex, Tabs, Box, useMantineTheme, Badge, ScrollArea } from "@mantine/core";
import { IconLanguage, IconCrystalBall, IconMessages } from "@tabler/icons-react";
import { useSelectedItem } from '../../context/SettingsContext';
import { languages, OptionType } from '../../types/languages';
import { emotions } from '../../types/emotions';
import { trivias } from '../../types/trivia';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { usePrompt } from "../../context/PromptConfig";

const options: OptionType[] = [
  { value: "GPT 3.5", label: "GPT 3.5" },
  { value: "GPT 4", label: "GPT 4" },
];

const audioProviders: OptionType[] = [
  { value: "Built-in Device", label: "Built-in Device" },
  { value: "Eleven Labs", label: "Eleven Labs" },
];

const builtinVoices: OptionType[] = [
  { value: "Voice 1", label: "Voice 1" },
  { value: "Voice 2", label: "Voice 2" },
  // add as needed
];

const elevenLabsVoices: OptionType[] = [
  { value: "Voice A", label: "Voice A" },
  { value: "Voice B", label: "Voice B" },
  // add as needed
];

const ChatSettings: React.FC = () => {
  const theme = useMantineTheme();
  const supabaseClient = useSupabaseClient();
  const { setLanguage, setSecondaryLanguage, setActions, setEmotion, setTrivia, setTriviaOn, setRecipes, setTriad, setAscii, setRpg, setRemoveEmojis, setRiddlesMode, setImpressionReadings, setAffiliation, setHardsetOn, setSarcasm, setDisagreeableness, setForceEmojis, setAdventureMode, setEmotionalSentiment } = useSelectedItem();
  const [selectedOption, setSelectedOption] = useState<string>(options[0].value);
  const [maxTokensMax, setMaxTokensMax] = useState(4096);
  const [primaryLanguage, setPrimaryLanguage] = useState<string | null>(null);
  const [audioProvider, setAudioProvider] = useState<string>(audioProviders[0].value);
  const [audioPersona, setAudioPersona] = useState<string>(builtinVoices[0].value);
  const [useSecondaryLanguage, setUseSecondaryLanguage] = useState(false);

  const {promptConfig} = usePrompt();

  const [secondLanguage, setSecondLanguage] = useState<string | null>("Basic English");
  const [languageLevel, setLanguageLevel] = useState<string | null>(null);
  const languageLevels = [{ value: "basic", label: "Basic" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }];
  const [hardsetEmotion, setHardsetEmotion] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [localTrivia, setLocalTrivia] = useState(false);
  const [selectedTrivia, setSelectedTrivia] = useState<string | null>(null);
  const [localAffiliation, setLocalAffiliation] = useState<number>(0.5);
  const [localImpressionReadings, setLocalImpressionReadings] = useState(false);
  const [localForceEmojis, setLocalForceEmojis] = useState(false);
  const [localRemoveEmojis, setLocalRemoveEmojis] = useState(false);
  const [localAdventureMode, setLocalAdventureMode] = useState(false);
  const [localRpg, setLocalRpg] = useState(false);
  const [localNsfw, setLocalNsfw] = useState(false);
  const [localActions, setLocalActions] = useState(false);
  const [localRecipes, setLocalRecipes] = useState(false);
  const [localAscii, setLocalAscii] = useState(false);
  const [localRiddlesMode, setLocalRiddlesMode] = useState(false);
  const [localTriad, setLocalTriad] = useState(false);
  const [localEmotionalSentiment, setLocalEmotionalSentiment] = useState(false);
  const [localSarcasm, setLocalSarcasm] = useState(0.0);
  const [localDisagreeableness, setLocalDisagreeableness] = useState<number>(0.5);


  const getAffiliationLabel = (affiliation: number | null) => {
    if (affiliation === null) {
      return 'No Affiliation';
    }
    if (affiliation === 0.0) {
      return 'Far Left';
    }
    if (affiliation === 0.1 || affiliation === 0.2) {
      return 'Left';
    }
    if (affiliation === 0.3 || affiliation === 0.4) {
      return 'Center Left';
    }
    if (affiliation === 0.5) {
      return 'Centrist';
    }
    if (affiliation === 0.6 || affiliation === 0.7) {
      return 'Center Right';
    }
    if (affiliation === 0.8 || affiliation === 0.9) {
      return 'Right';
    }
    if (affiliation === 1.0) {
      return 'Far Right';
    }
  };

  const affiliationLabel = getAffiliationLabel(localAffiliation);

  const getDisagreeablenessLabel = (disagreeableness: number | null) => {
    if (disagreeableness === null) {
      return 'Neutral';
    }
    if (disagreeableness === 0.0) {
      return 'Completely agreeable';
    }
    if (disagreeableness === 0.1 || disagreeableness === 0.2) {
      return 'Very agreeable';
    }
    if (disagreeableness === 0.3 || disagreeableness === 0.4) {
      return 'Agreeable';
    }
    if (disagreeableness === 0.5) {
      return 'Neutral';
    }
    if (disagreeableness === 0.6 || disagreeableness === 0.7) {
      return 'Disagreeable';
    }
    if (disagreeableness === 0.8 || disagreeableness === 0.9) {
      return 'Very disagreeable';
    }
    if (disagreeableness === 1.0) {
      return 'Completely disagreeable';
    }
  };

  const disagreeablenessLabel = getDisagreeablenessLabel(localDisagreeableness);

  let initialLanguage;

  try {
    const backendmods = promptConfig?.backendMods || null;
    initialLanguage = (backendmods && backendmods.xLanguage) ? backendmods.xLanguage : languages[0].value;
  } catch (e) {
    console.error('Error parsing backendmods cookie:', e);
    initialLanguage = languages[0].value;
  }

  const handleChangeImpressionReadings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalImpressionReadings(true);
      setImpressionReadings('true');
    } else {
      setLocalImpressionReadings(false);
      setImpressionReadings('false');
    }
  };

  const handleChangeForceEmojis = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalForceEmojis(true);
      setForceEmojis('true');
      setLocalRemoveEmojis(false);
      setRemoveEmojis('false');
    } else {
      setLocalForceEmojis(false);
      setForceEmojis('false');
    }
  };

  const handleChangeRemoveEmojis = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalRemoveEmojis(true);
      setRemoveEmojis('true');
      setLocalForceEmojis(false);
      setForceEmojis('false');
    } else {
      setLocalRemoveEmojis(false);
      setRemoveEmojis('false');
    }
  };

  const handleChangeAscii = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalAscii(true);
      setAscii('true');
    } else {
      setLocalAscii(false);
      setAscii('false');
    }
  };

  const handleChangeAdventureMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalAdventureMode(true);
      setAdventureMode('true');
      setTriviaOn('false');
      setLocalRecipes(false);
      setRecipes('false');
      setLocalRpg(false);
      setRpg('false');
      setLocalTrivia(false);
      setTrivia('false');
      setLocalRiddlesMode(false);
      setRiddlesMode('false');
    } else {
      setLocalAdventureMode(false);
      setAdventureMode('false');
    }
  };

  const handleChangeRiddlesMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalRiddlesMode(true);
      setRiddlesMode('true');
      setLocalTrivia(false);
      setTriviaOn('false');
      setLocalRecipes(false);
      setRecipes('false');
      setLocalRpg(false);
      setRpg('false');
      setLocalAdventureMode(false);
      setAdventureMode('false');
      setLocalTrivia(false);
      setTrivia('false');
    } else {
      setLocalRiddlesMode(false);
      setRiddlesMode('false');
    }
  };

  const handleChangeRecipes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalRecipes(true);
      setRecipes('true');
      setTriviaOn('false');
      setLocalRpg(false);
      setRpg('false');
      setLocalAdventureMode(false);
      setAdventureMode('false');
      setLocalRiddlesMode(false);
      setRiddlesMode('false');
      setLocalTrivia(false);
      setTrivia('false');
    } else {
      setLocalRecipes(false);
      setRecipes('false');
    }
  };

  const handleChangeTrivia = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalTrivia(true);
      setTriviaOn('true');
      setLocalRecipes(false);
      setRecipes('false');
      setLocalRpg(false);
      setRpg('false');
      setLocalAdventureMode(false);
      setAdventureMode('false');
      setLocalRiddlesMode(false);
      setRiddlesMode('false');
    } else {
      setLocalTrivia(false);
      setTriviaOn('false');
    }
  };

  const handleChangeEmotionalSentiment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalEmotionalSentiment(true);
      setEmotionalSentiment('true');
    } else {
      setLocalEmotionalSentiment(false);
      setEmotionalSentiment('false');
    }
  };

  const handleChangeActions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setLocalActions(true);
      setActions('true');
    } else {
      setLocalActions(false);
      setActions('false');
    }
  };

  const handleChangeHardsetOn = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      setHardsetEmotion(true);
      setHardsetOn('true');
    } else {
      setHardsetEmotion(false);
      setHardsetOn('false');
    }
  };

  const [isRotated, setIsRotated] = useState(false);
  const handleChangeTriad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    setIsRotated(true);

    setTimeout(() => {
      setIsRotated(false);
      if (isChecked) {
        setLocalTriad(true);
        setTriad('true');
      } else {
        setLocalTriad(false);
        setTriad('false');
      }
    }, 500);
  };

  useEffect(() => {
    setMaxTokensMax(selectedOption === "GPT 4" ? 2048 : 4096);
  }, [selectedOption]);

  useEffect(() => {
    setAudioPersona(audioProvider === "Built-in Device" ? builtinVoices[0].value : elevenLabsVoices[0].value);
  }, [audioProvider]);

  const handlePrimaryLanguageChange = (value: string | null) => {
    setPrimaryLanguage(value!);
    setLanguage(value!);
  };

  const handleSecondaryLanguageChange = (value: string | null) => {
    setSecondLanguage(value || '');
  };

  const handleLanguageLevelChange = (value: string | null) => {
    setLanguageLevel(value);
  };

  const handleAffiliationChange = (value: number) => {
    setLocalAffiliation(value);
    setAffiliation(value.toString());
  };

  const handleSarcasmChange = (value: number) => {
    setLocalSarcasm(value);
    setSarcasm(value.toString());
  };

  const handleDisagreeablenessChange = (value: number) => {
    setLocalDisagreeableness(value);
    setDisagreeableness(value.toString());
  };

  useEffect(() => {
    if (languageLevel && secondLanguage) {
      setSecondaryLanguage(`${secondLanguage} ${languageLevel}`);
    }
  }, [languageLevel, secondLanguage]);

  const handleEmotionChange = (value: string | null) => {
    setSelectedEmotion(value!);
    setEmotion(value!);
  };

  const handleTriviaChange = (value: string | null) => {
    setSelectedTrivia(value!);
    setTrivia(value!);
  };

  useEffect(() => {
    if (!promptConfig?.backendMods) return;

    try {
      const backendModsData = promptConfig.backendMods;

      // Update boolean states
      setLocalImpressionReadings(backendModsData.xImpression === 'true');
      setLocalForceEmojis(backendModsData.xEmojis === 'true');
      setLocalRemoveEmojis(backendModsData.xRemoveEmojis === 'true');
      setLocalAdventureMode(backendModsData.xAdventure === 'true');
      setLocalEmotionalSentiment(backendModsData.xEmotionalSentiment === 'true');
      if (typeof backendModsData.xEmotion === 'string' || backendModsData.xEmotion === null) {
        setSelectedEmotion(backendModsData.xEmotion);
      } else if (Array.isArray(backendModsData.xEmotion)) {
        setSelectedEmotion(backendModsData.xEmotion.join(', '));
      } else {
        console.error('Unexpected type for backendModsData.xEmotion:', typeof backendModsData.xEmotion);
      }
      setLocalTrivia(backendModsData.xTriviaOn === 'true');
      if (typeof backendModsData.xTrivia === 'string' || backendModsData.xTrivia === null) {
        setSelectedTrivia(backendModsData.xTrivia);
      } else if (Array.isArray(backendModsData.xTrivia)) {
        setSelectedTrivia(backendModsData.xTrivia.join(', '));
      } else {
        console.error('Unexpected type for backendModsData.xEmotion:', typeof backendModsData.xEmotion);
      }      setHardsetEmotion(backendModsData.xHardsetOn === 'true');
      setLocalAscii(backendModsData.xAscii === 'true');
      setLocalRiddlesMode(backendModsData.xRiddles === 'true');
      setLocalTriad(backendModsData.xTriad === 'true');
      setLocalRecipes(backendModsData.xRecipes === 'true');
      setLocalRpg(backendModsData.xRpg === 'true');
      setLocalNsfw(backendModsData.xNsfw === 'true');
      setLocalActions(backendModsData.xActions === 'true');

      // Update number states
      if (typeof backendModsData.xSarcasm === 'string' && !isNaN(parseFloat(backendModsData.xSarcasm))) {
        setLocalSarcasm(parseFloat(backendModsData.xSarcasm));
      } else if (Array.isArray(backendModsData.xSarcasm)) {
        // Handle the array case if needed, here I'm using the first string
        const value = backendModsData.xSarcasm[0];
        if (!isNaN(parseFloat(value))) {
          setLocalSarcasm(parseFloat(value));
        }
      }

      if (typeof backendModsData.xDisagreeableness === 'string' && !isNaN(parseFloat(backendModsData.xDisagreeableness))) {
        setLocalDisagreeableness(parseFloat(backendModsData.xDisagreeableness));
      } else if (Array.isArray(backendModsData.xDisagreeableness)) {
        const value = backendModsData.xDisagreeableness[0];
        if (!isNaN(parseFloat(value))) {
          setLocalDisagreeableness(parseFloat(value));
        }
      }

      if (typeof backendModsData.xAffiliation === 'string' && !isNaN(parseFloat(backendModsData.xAffiliation))) {
        setLocalAffiliation(parseFloat(backendModsData.xAffiliation));
      } else if (Array.isArray(backendModsData.xAffiliation)) {
        const value = backendModsData.xAffiliation[0];
        if (!isNaN(parseFloat(value))) {
          setLocalAffiliation(parseFloat(value));
        }
      }

    } catch (error) {
      console.error('Failed to parse and apply backendmodsCookie data:', error);
    }

  }, []);

  const activeGradient = 'linear-gradient(to right, #2E2E2E, #1B1B1B, #1B1B1B, #2E2E2E, #3F3F3F)';
  const inactiveGradient = 'linear-gradient(to right, #FFFFFF, #E5E5E5, #E5E5E5, #FFFFFF, #F2F2F2)'

  const getBadgeColor = (value: number) => {
    if (value === 0.5) return 'dark';
    if (value >= 0.0 && value <= 0.4) return 'blue';
    return 'red';
  };

  const [images, setImages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
      const fetchData = async () => {
          try {
                const imageNames = ['adventure.png', 'ascii.png', 'riddles.png', 'recipes.png', 'emotion.png', 'rpg.png', 'trivia.png', 'actions.png'];
                const promises = imageNames.map(async (imageName) => {
                  try {
                      const { data: publicUrlData } = await supabaseClient
                          .storage
                          .from('spark-menu-bucket')
                          .getPublicUrl(`settings/${imageName}`);

                      return [imageName, publicUrlData.publicUrl];
                  } catch (error: any) {
                      if (typeof error.message === 'string') {
                          console.error(`Failed to get public URL for image settings/${imageName}:`, error.message);
                      } else {
                          console.error(`Failed to get public URL for image settings/${imageName}:`, error);
                      }
                      return [imageName, null];
                  }
              });

              const resolvedUrls = await Promise.all(promises);
              const imageUrls: { [key: string]: string } = {};

              for (const [imageName, imageUrl] of resolvedUrls) {
                  if (imageUrl) {
                      imageUrls[imageName as string] = imageUrl;
                  }
              }

              setImages(imageUrls);

          } catch (error) {
              console.log(error);
          }
      };

      fetchData();
  }, []);



  return (

    <Box style={{
      width: '100%',
      marginTop:'-3vh'
    }}>
    <Tabs variant="outline" defaultValue="chatbot" color={theme.colorScheme === 'dark' ? 'gray' : 'blue'}>

      <Tabs.List>
        <Tabs.Tab value="chatbot" icon={<IconMessages size="0.8rem" />}>
          Chatbot
        </Tabs.Tab>
        <Tabs.Tab value="tuning" icon={<IconCrystalBall size="0.8rem" />}>
          Tuning
        </Tabs.Tab>
        <Tabs.Tab value="language" icon={<IconLanguage size="0.8rem" />}>
          Language
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="language" p="lg" style={{height:'100%'}}>
          <Flex align="flex-start" direction="column" style={{ marginTop: 15 }}>
            <Flex gap="md">
              <Switch checked={true} disabled />
              <Text style={{ marginLeft: 5, marginTop:'-4px'}}>Primary Language</Text>
            </Flex>
            <Select
              placeholder="Set language"
              data={languages}
              value={primaryLanguage}
              onChange={handlePrimaryLanguageChange}
              style={{ marginLeft: 10, marginTop:'5px' }}
            />
          </Flex>

          <Flex align="flex-start" direction="column" style={{ marginTop: 15 }}>
            <Flex gap="md">
              <Switch checked={useSecondaryLanguage} onChange={(event) => setUseSecondaryLanguage(event.target.checked)} />
              <Text style={{ marginLeft: 5, marginTop:'-4px'}}>Secondary Language</Text>
            </Flex>
            {useSecondaryLanguage && (
              <Flex gap="md" direction="row" style={{marginTop:'5px'}}>
                <Select
                  placeholder="Set level"
                  data={languageLevels}
                  value={languageLevel}
                  onChange={handleLanguageLevelChange}
                />
                <Select
                  placeholder="Set language"
                  data={languages.filter((language) => language.value !== primaryLanguage)}
                  value={secondLanguage && secondLanguage.split(" ")[0]}
                  onChange={handleSecondaryLanguageChange}
                  style={{ marginLeft: 10 }}
                />
              </Flex>
            )}
          </Flex>

          {useSecondaryLanguage && (
            <Text size="sm" color="dimmed" style={{ marginTop: 10 }}>
              Using a secondary language directs the chatbot to send the same response twice in a message,
              but the second time in the secondary language
            </Text>
          )}
        </Tabs.Panel>

      <Tabs.Panel value="tuning" p="lg" style={{height:'100%'}}>
      <ScrollArea
      style={{paddingBottom:'15vh', height:'85vh'}}
      w="100%"
      p="2%"
      scrollHideDelay={0} >
      <Box style={{
        padding: '10px',
        paddingBottom: '20px',
        border: '1px solid rgb(160,160,160)',
        borderRadius: '7px',
        marginTop: 15,
        background: localTriad ? `${activeGradient}, url(settings/triad/${isRotated ? '1' : '2'}.png) right center / auto 100% no-repeat` : `${inactiveGradient}, url(settings/triad/${isRotated ? '1' : '2'}.png) right center / auto 100% no-repeat`
      }}>
        <Flex align="center" style={{ marginTop: 15 }}>
          <Switch checked={localTriad} color="dark" onChange={handleChangeTriad} style={{cursor:'pointer'}}/>
          <Text style={{ marginLeft: 10, fontWeight: 'bold', display: localTriad ? 'none' : 'block', color: localTriad ? 'white' : '#2E2E2E' }}>
            Light triad
          </Text>
          <Text style={{ marginLeft: 10, fontWeight: 'bold', display: localTriad ? 'block' : 'none', color: localTriad ? 'white' : '#2E2E2E' }}>
            Dark triad
          </Text>
        </Flex>
        <Text color="dimmed" size="sm" style={{ marginTop: 10, color: localTriad ? 'white' : '#2E2E2E', opacity: '0.85'}}>
          Set the light triad vs dark triad personality traits in the chatbot.
        </Text>
      </Box>
      <Box style={{
        padding: '10px',
        border:'1px solid',
        paddingBottom:'15px',
        borderRadius: '7px',
        marginTop: 15
      }}>
        <Box style={{width:'60vw'}}>
          <Text size="md" style={{ fontWeight: 'bold'}}>
            Political Bias:
            <Badge style={{marginLeft:'5px'}} color={getBadgeColor(localAffiliation)}>
              {affiliationLabel}
            </Badge>
          </Text>
          <Slider
            style={{width:'50vw', marginTop:8}}
            min={0.0}
            max={1.0}
            step={0.1}
            value={localAffiliation}
            onChange={handleAffiliationChange}
            color={getBadgeColor(localAffiliation)}
          />
        </Box>
        <Text color="dimmed" size="sm" style={{ marginTop: 10, opacity:'0.85'}}>
          Set a political bias to the chatbot for a dynamic personality tuning.
        </Text>
      </Box>
      <Box style={{
        padding: '10px',
        border:'1px solid',
        paddingBottom:'15px',
        borderRadius: '7px',
        marginTop: 15
      }}>
      <Box style={{width:'50vw'}}>
        <Text size="md" style={{fontWeight:'bold'}}>Disagreeableness:
        <Badge style={{marginLeft:'5px'}} color={
              localDisagreeableness === 0.5
                ? 'dark'
                : localDisagreeableness === 0.0
                ? '#FFB6C1'
                : localDisagreeableness === 0.1
                ? '#FFB6C1'
                : localDisagreeableness === 0.2
                ? '#FFB6C1'
                : localDisagreeableness === 0.3
                ? '#FFB6C1'
                : localDisagreeableness === 0.4
                ? '#FFB6C1'
                : localDisagreeableness === 0.6
                ? '#453C39'
                : localDisagreeableness === 0.7
                ? '#453C39'
                : localDisagreeableness === 0.8
                ? '#453C39'
                : localDisagreeableness === 0.9
                ? '#453C39'
                : localDisagreeableness === 1.0
                ? '#453C39'
                : '#453C39'
            }
        >
          {disagreeablenessLabel}
        </Badge>
      </Text>
      <Slider
        style={{width:'50vw', marginTop:8}}
        min={0.0}
        max={1.0}
        step={0.1}
        value={localDisagreeableness}
        onChange={handleDisagreeablenessChange}
        color={
              localDisagreeableness === 0.5
                ? 'dark'
                : localDisagreeableness === 0.0
                ? '#FFB6C1'
                : localDisagreeableness === 0.1
                ? '#FFB6C1'
                : localDisagreeableness === 0.2
                ? '#FFB6C1'
                : localDisagreeableness === 0.3
                ? '#FFB6C1'
                : localDisagreeableness === 0.4
                ? '#FFB6C1'
                : localDisagreeableness === 0.6
                ? '#453C39'
                : localDisagreeableness === 0.7
                ? '#453C39'
                : localDisagreeableness === 0.8
                ? '#453C39'
                : localDisagreeableness === 0.9
                ? '#453C39'
                : localDisagreeableness === 1.0
                ? '#453C39'
                : '#453C39'
          }
      />
    </Box>
    <Text color="dimmed" size="sm" style={{ marginTop: 10, opacity:'0.85'}}>
      Higher level will make the chatbot more disagreeable and debate-worthy.
    </Text>
    </Box>
      <Box style={{
        padding: '10px',
        border:'1px solid',
        paddingBottom:'15px',
        borderRadius: '7px',
        marginTop: 15
      }}>
        <Box style={{width:'50vw'}}>
          <Text size="md" style={{fontWeight:'bold'}}>Sarcasm: {localSarcasm}</Text>
          <Slider
            min={0}
            max={10}
            step={1}
            value={localSarcasm}
            onChange={handleSarcasmChange}
            color="green"
            style={{marginTop:8}}
          />
        </Box>
        <Text color="dimmed" size="sm" style={{ marginTop: 10, opacity:'0.85'}}>
          Higher level will make the chatbot more sarcastic in its responses.
        </Text>
        </Box>
      </ScrollArea>
        </Tabs.Panel>
        <Tabs.Panel value="chatbot" p="lg" style={{height:'100%'}}>
        <ScrollArea
        style={{paddingBottom:'15vh', height:'85vh'}}
        w="100%"
        p="2%"
        scrollHideDelay={0} >
        <Box style={{
          background: `url(${images['adventure.png']}) right center / auto 100% no-repeat, linear-gradient(to right, rgb(135, 206, 235), rgb(70, 130, 180), rgb(70, 130, 180), rgb(135, 206, 250), rgb(173, 216, 230))`,
          padding: '10px',
          paddingBottom:'20px',
          border:'1px solid rgb(70, 130, 180)',
          borderRadius: '7px',
          marginTop: 15
        }}>
        <Flex align="center" style={{ marginTop: 15 }}>
          <Switch checked={localAdventureMode} onChange={handleChangeAdventureMode} style={{cursor:'pointer'}}/>
          <Text style={{ marginLeft: 10, fontWeight:'bold', color:'white'}}>Adventure mode</Text>
        </Flex>
        <Text color="dimmed" size="sm" style={{ marginTop: 10, color:'white', opacity:'0.85', width:'60%'}}>
            Turns the chatbot into an interactive choose-your-own adventure game.
        </Text>
        </Box>
        <Box style={{
          background: `url(${images['riddles.png']}) right center / auto 100% no-repeat, linear-gradient(to right, #0b6957, #139375, #139375, #1fb492, #30c4a6)`,
          padding: '10px',
          paddingBottom:'20px',
          border:'1px solid #139375',
          borderRadius: '7px',
          marginTop: 15
        }}>
        <Flex align="center" style={{ marginTop: 15 }}>
          <Switch checked={localRiddlesMode} onChange={handleChangeRiddlesMode} style={{cursor:'pointer'}}/>
          <Text style={{ marginLeft: 10, fontWeight:'bold', color:'white'}}>Riddles mode</Text>
        </Flex>
        <Text color="dimmed" size="sm" style={{ marginTop: 10, color:'white', opacity:'0.85', width:'60%'}}>
            Turns the chatbot into an interactive riddles game.
        </Text>
        </Box>
        <Box style={{
          background: `url(${images['ascii.png']}) right center / auto 100% no-repeat, linear-gradient(to right, #050505, #252525, #252525, #151515, #050505)`,
          padding: '10px',
          paddingBottom: '20px',
          border: '1px solid #868A00',
          borderRadius: '7px',
          marginTop: 15
        }}>
          <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={localAscii} color="lime" onChange={handleChangeAscii} style={{cursor:'pointer'}} />
            <Text style={{ marginLeft: 10, fontWeight: 'bold', color: '#868A00' }}>ASCII mode</Text>
          </Flex>
          <Text color="dimmed" size="sm" style={{ marginTop: 10, color: '#868A00', opacity: '0.85', width: '60%' }}>
            Makes the chatbot return ASCII art with every prompt.
          </Text>
        </Box>
        <Box style={{
              background: `url(${images['recipes.png']}) right center / auto 100% no-repeat, linear-gradient(to right, rgb(244, 164, 96), rgb(210, 105, 30), rgb(210, 105, 30), rgb(244, 164, 124), rgb(255, 228, 196))`,
              padding: '10px',
              paddingBottom:'20px',
              border:'1px solid rgb(210, 105, 30)',
              borderRadius: '7px',
              marginTop: 15
            }}>
            <Flex align="center" style={{ marginTop: 15 }}>
              <Switch checked={localRecipes} onChange={handleChangeRecipes} style={{cursor:'pointer'}}/>
              <Text style={{ marginLeft: 10, fontWeight:'bold', color:'white'}}>Recipe mode</Text>
            </Flex>
            <Text color="dimmed" size="sm" style={{ marginTop: 10, color:'white', opacity:'0.85', width:'60%'}}>
                Transforms the chatbot into a cooking recipe creator.
            </Text>
        </Box>
        <Box style={{
          background: `url(${images['actions.png']}) right center / auto 100% no-repeat, linear-gradient(to right, #FFA07A, #FF6347, #FF6347, #FF4500, #FF8C00)`,
          padding: '10px',
          paddingBottom:'20px',
          border:'1px solid #FF6347',
          borderRadius: '7px',
          marginTop: 15
        }}>
        <Flex align="center" style={{ marginTop: 15 }}>
          <Switch checked={localActions} onChange={handleChangeActions} style={{cursor:'pointer'}}/>
          <Text style={{ marginLeft: 10, fontWeight:'bold', color:'white'}}>Action mode</Text>
        </Flex>
        <Text color="dimmed" size="sm" style={{ marginTop: 10, color:'white', opacity:'0.85', width:'60%'}}>
            Makes the chatbot also respond with adlibs for more immersive interactions.
        </Text>
        </Box>
        <Box style={{
          background: `url(${images['trivia.png']}) right center / auto 100% no-repeat, linear-gradient(to right, #88E0E0, #66D2D2, #44C4C4, #22B6B6, #00A8A8)`,
          padding: '10px',
          border:'1px solid #44C4C4',
          paddingBottom:'15px',
          borderRadius: '7px',
          marginTop: 15
        }}>
        <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={localTrivia} onChange={handleChangeTrivia} />
            <Text style={{ marginLeft: 10, fontWeight:'bold', color:'white' }}>Trivia mode</Text>
        </Flex>
        <Select
            placeholder="Set topic"
            data={trivias}
            value={selectedTrivia}
            onChange={handleTriviaChange}
            disabled={!localTrivia}
            style={{ marginLeft: 10, marginTop:'2.5vh', maxWidth:'50%'}}
        />
        <Text color="dimmed" size="sm" style={{ marginTop: 10, color:'white', opacity:'0.85', width:'60%' }}>
        Mofifies the chatbot to become a trivia machine.
        </Text>
        </Box>
        <Box style={{
          background: `url(${images['emotion.png']}) right center / auto 100% no-repeat, linear-gradient(to right, #9CEB87, #4BB446, #4BB446, #95FA87, #BCE6AD)`,
          padding: '10px',
          border:'1px solid #4BB446',
          paddingBottom:'15px',
          borderRadius: '7px',
          marginTop: 15
        }}>
        <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={hardsetEmotion} onChange={handleChangeHardsetOn} />
            <Text style={{ marginLeft: 10, fontWeight:'bold', color:'white' }}>Hardset emotion</Text>
        </Flex>
        <Select
            placeholder="Set emotion"
            data={emotions}
            value={selectedEmotion}
            onChange={handleEmotionChange}
            disabled={!hardsetEmotion}
            style={{ marginLeft: 10, marginTop:'2.5vh', maxWidth:'50%'}}
        />
        <Text color="dimmed" size="sm" style={{ marginTop: 10, color:'white', opacity:'0.85', width:'60%' }}>
            Use this to hardset a specific emotion to the chatbot.
        </Text>
        </Box>
          <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={localEmotionalSentiment} onChange={handleChangeEmotionalSentiment} style={{cursor:'pointer'}}/>
            <Text style={{ marginLeft: 10, fontWeight:'bold' }}>Emotional Sentiment</Text>
          </Flex>
          <Text size="sm" color="dimmed" style={{ marginTop: 10 }}>
            Makes the chatbot respond with an emoji at the bottom of each message to display their current emotion.
          </Text>
          <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={localImpressionReadings} onChange={handleChangeImpressionReadings} style={{cursor:'pointer'}}/>
            <Text style={{ marginLeft: 10, fontWeight:'bold' }}>Impression Readings</Text>
          </Flex>
          <Text size="sm" color="dimmed" style={{ marginTop: 10 }}>
            Makes the chatbot respond with a 🟥, 🟧 or 🟩 at the bottom of each message to display its impression of the user.
          </Text>
          <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={localForceEmojis} onChange={handleChangeForceEmojis} style={{cursor:'pointer'}}/>
            <Text style={{ marginLeft: 10, fontWeight:'bold' }}>Force emojis</Text>
          </Flex>
          <Text size="sm" color="dimmed" style={{ marginTop: 10 }}>
              Forces the chatbot to use emojis if the mod it uses does not already use them.
          </Text>
          <Flex align="center" style={{ marginTop: 15 }}>
            <Switch checked={localRemoveEmojis} onChange={handleChangeRemoveEmojis} style={{cursor:'pointer'}}/>
            <Text style={{ marginLeft: 10, fontWeight:'bold' }}>Remove emojis</Text>
          </Flex>
          <Text size="sm" color="dimmed" style={{ marginTop: 10 }}>
              Removes the chatbots ability to use emojis if the mod it uses has them.
          </Text>
          </ScrollArea>
      </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

export default ChatSettings;
