import { useEffect, useState } from 'react';
import { Text, Box, ActionIcon, ThemeIcon, Flex, Button, Paper } from "@mantine/core";
import icons, { IconNames } from '../icons/icons';
import { lighten } from 'polished';
import  { IconSettings, IconCheck, IconPhoto, IconRefresh, IconMessageChatbot, IconHistory, IconX, IconRobot, IconFlask, IconBook } from "@tabler/icons-react";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import styled, { keyframes } from 'styled-components';
import Image from 'next/image';
import { useMediaQuery } from "@mantine/hooks";
import { SparkGPT } from '../spark-gpt/main';
import Cookies from 'js-cookie';
import ChatSettings from "../spark-gpt/settings";
import UploadedFiles from "../spark-gpt/files";
import Companions from "../spark-gpt/companions";
import StyledLoader from '../loader';
import Convos from "../spark-gpt/convos";
import ModWidgetMain from "../widgets/main";
import { useActiveComponent } from '../../context/NavContext';
import { useCompanion } from '../../context/MemoriesContext';
import { usePrompt } from '../../context/PromptConfig';
import { useConfig } from '../../context/ConfigContext';
import { useMessages } from '../../context/MessageContext';

interface Mod {
  xTitle: string;
  xType: string;
  xEmbed: string;
  xImage: string;
  imageURL?: string;
  xDescription: string;
  xProduct: string;
  xShowImpressionLevels?: string;
  xImpressionLevelRed?: string;
  xImpressionLevelGreen?: string;
  xShowEmotionalState?: string;
  xPrompt: string;
  xIcon: string;
  iconColor: string;
  xAuthor: string;
  xTags?: string[];
}

type BackendCompanionsType = {
  cCompanion: string;
  cName: string;
  cChatcode: string;
  cPfp: string;
  cDescription: string;
  cIntros: string;
  cCharacters: string;
  cExtras: string;
};

export default function Chatbot() {
  const [mod, setMod] = useState<Mod[]>([]);
  const [sortMod, setSortMod] = useState('Latest');
  const [sortedMod, setSortedMod] = useState([...mod]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const userId = user?.id;
  const adminUserId = '95953152-6e6a-4ac4-9f67-9dda8fc4c134'
  const [isAdmin, setIsAdmin] = useState(false);
  const supabaseClient = useSupabaseClient();
  const isMobile = useMediaQuery('(max-width: 726px)');
  const isDesktop = useMediaQuery('(min-width: 727px)');
  const [showConvo, setShowConvo] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [companion, setCompanion] = useState<BackendCompanionsType | null>(null);
  const {promptConfig, setPromptConfig} = usePrompt();
  const { setNewConvo } = useMessages();
  const [backendModsValue, setBackendModsValue] = useState(promptConfig?.backendMods);
  const {
    setActiveComponent,
    setOpenSettings,
    setOpenFiles,
    setOpenMods,
    setOpenConvos,
    setOpenCompanions,
    setCharSwitch,
    charSwitch,
    openConvos,
    openMods,
    openCompanions,
    openFiles,
    openSettings
  } = useActiveComponent();
  const { accountType, sparkConfig } = useConfig();

  const shouldShowComponent = (componentName: string) => {
      if (!sparkConfig || !accountType) {
          return false;
      }
      const config = sparkConfig[accountType as keyof typeof sparkConfig];
      if (!config) {
          return false;
      }
      return config[componentName as keyof typeof config] !== false;
  };

  const handleReloadClick = () => {
    window.location.reload();
  };

  let gamebarActive = false;

  if (promptConfig?.backendMods) {
    const backendModData = promptConfig.backendMods;
    if (backendModData.xRpg === 'true') {
      gamebarActive = true;
    }
  }

  useEffect(() => {
    if (userId === adminUserId) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [adminUserId, userId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/get-companion');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        let data = await res.json();
        if (data[0]?.SCOMP) {
          data = data[0].SCOMP;
          const promises = data.map(async (mod: Mod) => {
            try {
              const {data: publicUrlData} = await supabaseClient
                .storage
                .from('spark-menu-bucket')
                .getPublicUrl(`companions/${mod.xImage}`);
              return {...mod, imageURL: publicUrlData.publicUrl};
            } catch (error: any) {
                if (typeof error.message === 'string') {
                  console.error(`Failed to get public URL for image companions/${mod.xImage}:`, error.message);
                } else {
                  console.error(`Failed to get public URL for image companions/${mod.xImage}:`, error);
                }
                return mod;
              }
          });
          const mods = await Promise.all(promises);
          mods.forEach(mod => console.log(mod.imageURL));
          setMod(mods);
          setSortedMod([...mods]);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortMod]);

  const blendWithWhite = (r: number, g: number, b: number, a: number) => {
    const inverseAlpha = 1 - a;
    r = Math.round((r * a) + (255 * inverseAlpha));
    g = Math.round((g * a) + (255 * inverseAlpha));
    b = Math.round((b * a) + (255 * inverseAlpha));

    const rgbValues = [r, g, b].map(v => {
      let hex = v.toString(16);
      if (hex.length < 2) {
        hex = '0' + hex;
      }
      return hex;
    });
    return `#${rgbValues.join('')}`;
  };

  const renderIcon = (name: string, color: string | undefined) => {
    let XIcon: any = null;
    let rgbaIconColor: string | undefined = color;

    if (name in icons) {
      const iconName = name as IconNames;
      XIcon = icons[iconName];
      if (typeof color === 'string') {
          const lightenedColor = lighten(0.2, color);
          if (typeof lightenedColor === 'string') {
            const rgbValues = lightenedColor.match(/\w\w/g);
            if (rgbValues) {
              const [r, g, b] = rgbValues.map((i: string) => parseInt(i, 16));
              const a = 0.3;
              rgbaIconColor = blendWithWhite(r, g, b, a);
            }
          }
      }
    } else {
      XIcon = IconSettings;
    }

    return (
      XIcon ? (
        <ActionIcon
          onClick={handleOpenModsClick}
          aria-label="Open mods"
          size="md"
          variant="transparent"
          color="black"
          style={{marginLeft:'3px', marginRight:'3px', borderRadius:'2px'}}
        >
          <Box style={{ backgroundColor: rgbaIconColor, padding: '1%', borderRadius: '3px' }}>
            <XIcon size={30} color={color} />
          </Box>
        </ActionIcon>
      ) : (
          <div>Icon: {name} not found</div>
      )
    );
  };

      let parsedMods = null;

      if (promptConfig?.backendMods) {
        parsedMods = promptConfig.backendMods;
      }

      const handleOpenModsClick = () => {
        if (!sparkConfig?.main.cloudPlayOnly) {
          setOpenMods(true);
          setNewConvo(true);
        } else {
          setActiveComponent('Library');
        }
      };

      const handleSettingsClick = () => {
        setOpenSettings(true);
      };

      const { showCompanions, setShowCompanions } = useCompanion();

      const handleCompanionsClick = () => {
        setOpenSettings(false);
        setOpenMods(false);
        setShowCompanions(true);
      };

      const handleConvosClick = () => {
        if (openConvos) {
          if(promptConfig){
            setPromptConfig({
              ...promptConfig,
              showConversationComponent : false
            });
          }
          else{
            setPromptConfig({
              showConversationComponent : false
            })
          }
        } else {
          if(promptConfig){
            setPromptConfig({
              ...promptConfig,
              showConversationComponent : true
            });
          }
          else{
            setPromptConfig({
              showConversationComponent : true
            })
          }
        }
        setOpenConvos(!openConvos);
      };

      useEffect(() => {
          const checkShowConvo = () => {
              const currentShowConvo = promptConfig?.showConversationComponent;
              setShowConvo(currentShowConvo || false);
          }

          checkShowConvo();
          const intervalId = setInterval(checkShowConvo, 500);

          return () => {
              clearInterval(intervalId);
          }
      }, []);

      useEffect(() => {
         if (!showConvo) {
            setOpenSettings(false);
            setOpenMods(false);
            setOpenFiles(false);
            setOpenConvos(false);
            setOpenCompanions(false);
         }
         if (showConvo) {
            setOpenConvos(true);
         }
      }, [showConvo]);

      const handleCloseClick = () => {
        Cookies.set('showConversationComponent', 'false');
        setOpenSettings(false);
        setOpenMods(false);
        setOpenFiles(false);
        setOpenConvos(false);
        setOpenCompanions(false);
      };

      useEffect(() => {
         const originalOverflowY = document.body.style.overflowY;
         const originalHeight = document.body.style.height;

         document.body.style.overflowY = 'hidden';
         document.body.style.height = '100%';

         return () => {
           document.body.style.overflowY = originalOverflowY;
           document.body.style.height = originalHeight;
         };
       }, []);

              useEffect(() => {
                if (!Cookies.get('newuser')) {
                  setIsNewUser(true);
                }
              }, []);

              useEffect(() => {
                setCompanion(promptConfig?.backendCompanions as BackendCompanionsType || null);
              }, []);

              useEffect(() => {
                if (charSwitch) {
                  setCompanion(null);
                  setCharSwitch(false);
                }
              }, []);

              const handleStopUsingClick = () => {
                if(promptConfig){
                  setPromptConfig({
                    ...promptConfig,
                    backendCompanions: null
                  });
                }
                else{
                  setPromptConfig({
                    backendCompanions: null
                  });
                }
                setCompanion(null);
                setActiveComponent('Laboratory')
                setShowCompanions(true);
              }

              let companionData: any = companion;
              if (promptConfig?.backendCompanions) {
                  companionData = promptConfig.backendCompanions;
              }

              useEffect(() => {
                const intervalId = setInterval(() => {
                  const currentValue = promptConfig?.backendMods;
                  if (currentValue !== backendModsValue) {
                    setBackendModsValue(currentValue);
                  }
                }, 1000);

                return () => clearInterval(intervalId);
              }, [backendModsValue]);

  return (
    <>
    {loading ? (
      <div>
  <StyledLoader />
  </div>
) : (
    <>
    {(openSettings !== openMods !== openFiles !== openConvos !== openCompanions) && (
      <>
      {isMobile ? (
        <Button
          onClick={handleCloseClick}
          aria-label="Close widget"
          color="black"
          variant="default"
          size="xl"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 3,
            borderRadius:'0px'
          }}
        >
          Save and close
        </Button>
      ) : (
        <ActionIcon
          onClick={handleCloseClick}
          aria-label="Close widget"
          color="dark"
          variant="default"
          style={{
            position: 'fixed',
            bottom: openSettings ? '6vh' : '-5vh',
            borderBottom: '0px',
            right: '20px',
            marginLeft: '0px',
            marginTop: '0px',
            borderRadius: '0px',
            width: '210px',
            height: '64px',
            zIndex: '3',
            padding: '7px',
            fontWeight: 'bold'
          }}
        >
           Save and close<IconCheck size={20} style={{marginLeft:'5px'}}/>
        </ActionIcon>
      )}
      </>
    )}
    {
      openFiles && <Paper style={{height:'100%'}}><UploadedFiles /></Paper>
    }

    {
      openSettings && <Paper style={{height:'100%'}}><ChatSettings /></Paper>
    }

    {
      openMods && <Box style={{height:'100%'}}><ModWidgetMain /></Box>
    }

    {
      openConvos && <Box style={{height:'100%'}}><Convos /></Box>
    }
    {showCompanions && <Box style={{height:'100%'}}><Companions /></Box>}

    <Box style={{
    padding: '0px',
    opacity: (!openSettings && !openMods && !openFiles && !openConvos && !openCompanions) ? 1 : 0,
    height: (!openSettings && !openMods && !openFiles && !openConvos && !openCompanions) ? 'auto' : 0,
    position: 'relative'
  }}>
  <Box style={{position: (!openSettings && !openMods && !openFiles && !openConvos) ? 'relative' : 'absolute'}}>
    <SparkGPT />
  </Box>
  {
    companionData ? (
      <Box style={{ paddingLeft: '8px', paddingRight: '8px' }}>
      <Flex justify="center">
        <Paper shadow="xs" style={{
          borderRadius: '6px',
          padding: '4px',
          width: isDesktop ? '50%' : '100%'
        }}>
          <Flex justify="space-between" align="center">
            <Flex>
            {
                companionData.cPfp && companionData.cPfp !== 'empty.png' ? (
                    <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/spark-menu-bucket/companions/${companionData.cPfp}`}
                        alt="Companion image"
                        style={{ width: '25px', height: '25px', borderRadius: '6px' }}
                    />
                ) : (
                    <ThemeIcon style={{ width: '25px', height: '25px', borderRadius:'100%'}} variant="outline" color="gray">
                        <IconPhoto size={15}/>
                    </ThemeIcon>
                )
            }
              <Text style={{ marginLeft: '6px', opacity: '0.75' }}>Talking with <b>{companionData.cName}</b></Text>
            </Flex>
            <Button size="xs" rightIcon={<IconX />} onClick={handleStopUsingClick}>Stop using</Button>
          </Flex>
        </Paper>
        </Flex>
      </Box>
    ) : (
      <>

    <Flex direction="row" align="center" justify="center" style={{bottom:0, marginTop:gamebarActive ? '-40px' : '0px'}}>
    <Flex justify={isMobile ? 'flex-start' : 'none'}>
    {shouldShowComponent('laboratory') && (
        <ActionIcon
          onClick={() => setActiveComponent('Laboratory')}
          aria-label="Laboratory"
          size="md"
          variant="default"
          color="black"
          style={{marginLeft:'3px', marginRight:'3px'}}
        >
        <IconFlask size="2rem"/>
        </ActionIcon>
    )}
    {shouldShowComponent('library') && !sparkConfig?.main.cloudPlayOnly && (
        <ActionIcon
          onClick={() => setActiveComponent('Library')}
          aria-label="Library"
          size="md"
          variant="default"
          color="black"
          style={{marginLeft:'3px', marginRight:'3px'}}
        >
        <IconBook size="2.5rem"/>
        </ActionIcon>
    )}
    </Flex>
    {!shouldShowComponent('getCompanions') || !shouldShowComponent('createCompanions') && (
    <ActionIcon
      onClick={handleCompanionsClick}
      aria-label="Companions"
      size="md"
      variant="default"
      color="black"
      style={{marginLeft:'3px', marginRight:'3px'}}
    >
      <IconMessageChatbot size="3rem"/>
    </ActionIcon>
    )}
    {(parsedMods && typeof parsedMods.xIcon === 'string' && typeof parsedMods.iconColor === 'string'
      ? renderIcon(parsedMods.xIcon, parsedMods.iconColor)
      : <ActionIcon
      onClick={handleOpenModsClick}
      aria-label="Open mods"
      size="md"
      variant="default"
      color="black"
      style={{marginLeft:'3px', marginRight:'3px'}}
    >
      <IconRobot size="3rem"/>
      </ActionIcon>
    )}

    {shouldShowComponent('settings') && (
    <ActionIcon
      onClick={handleSettingsClick}
      aria-label="Settings"
      size="md"
      variant="default"
      color="black"
      style={{marginLeft:'3px', marginRight:'3px'}}
    >
      <IconSettings size="2.5rem"/>
    </ActionIcon>
  )}
    <Flex justify={isMobile ? 'flex-end' : 'none'}>
    {shouldShowComponent('history') && (
        <ActionIcon
          onClick={handleConvosClick}
          aria-label="History"
          size="md"
          variant="default"
          color="black"
          style={{marginLeft:'3px', marginRight:'3px'}}
        >
        <IconHistory size="2rem"/>
        </ActionIcon>
      )}
    </Flex>
    </Flex>
    </>
  )}
    </Box>
    <Flex direction="column" align="flex-end" style={{ position: 'absolute', top: 0, right: 0, zIndex: 9999 }}>
      <ActionIcon onClick={handleReloadClick} aria-label="Reload page">
        <IconRefresh />
      </ActionIcon>
    </Flex>
    </>
  )}
</>
  );
}
