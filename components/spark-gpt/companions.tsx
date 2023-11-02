import React, { useEffect, useState } from 'react';
import { Button, Box, ScrollArea, Select, ActionIcon, Paper, Text, Tabs, TextInput, Flex, Image, Title, Badge, Modal, ThemeIcon } from '@mantine/core';
import { IconBrain, IconFile, IconRobot, IconPhotoPlus, IconTrash, IconPhoto, IconDownload, IconUpload, IconChevronRight, IconFileTypePpt, IconFileTypeTxt, IconFileTypePdf, IconFileTypeDocx, IconFileTypeXml, IconFileTypeXls, IconFileTypeHtml, IconPlus, IconArrowBack, IconPencil, IconCheck, IconClipboard, IconBrandSpeedtest, IconMessageChatbot } from '@tabler/icons-react';
import FullScreenTextEditor from './companions/texteditor';
import ImgDropzone from './companions/img-dropzone';
import FilesComponent from './companions/files';
import PromptsComponent from './companions/prompts';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useMediaQuery } from "@mantine/hooks";
import { usePrompt } from '../../context/PromptConfig';
import { useActiveComponent } from '../../context/NavContext';
import { useCompanion } from '../../context/MemoriesContext';
import { useConfig } from '../../context/ConfigContext';
import styled, { keyframes } from 'styled-components';
import StyledLoader from '../loader';

interface Companion {
  companion_id: string;
  name: string;
  created_at: string;
  description: string;
  settings: object;
  pfp: string;
  chatcode: string;
  extras: string;
  intros: string;
  characters: string;
}

export default function Companions() {
  const { setSelectedCompanion, setShowPrompts, showPrompts, setShowFiles, showFiles, showTextEditor, setShowTextEditor, setShowCompanions, setIsImgDropzoneOpen, isImgDropzoneOpen, pfpUploads } = useCompanion();
  const { setActiveComponent } = useActiveComponent();
  const { accountType, sparkConfig } = useConfig();
  const [companions, setCompanions] = useState<Companion[] | undefined>(undefined);
  const [creatingCompanion, setCreatingCompanion] = useState(false);
  const [companionName, setCompanionName] = useState('');
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(null);
  const [companionDescription, setCompanionDescription] = useState('');
  const [companionPfp, setCompanionPfp] = useState('');
  const [companionChatcode, setCompanionChatcode] = useState('');
  const [editName, setEditName] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [localChatcode, setLocalChatcode] = useState('');
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [sharedCompanions, setSharedCompanions] = useState<Companion[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const {promptConfig, setPromptConfig} = usePrompt();

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

  const getDefaultTab = () => {
      if (shouldShowComponent('createCompanions')) return 'myCompanions';
      if (shouldShowComponent('getCompanions')) return 'sharedWithMe';
      return '';
  };

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch(extension) {
    case 'pdf':
      return <IconFileTypePdf />;
    case 'doc':
    case 'docx':
      return <IconFileTypeDocx />;
    case 'txt':
      return <IconFileTypeTxt />;
    case 'html':
      return <IconFileTypeHtml />;
    case 'xls':
      return <IconFileTypeXls />;
    case 'xml':
      return <IconFileTypeXml />;
    case 'ppt':
      return <IconFileTypePpt />;
    default:
      return <IconFile />;
  }
}
  const supabaseClient = useSupabaseClient();
  const isMobile = useMediaQuery('(max-width: 726px)');
  const user = useUser();
  const userId = user?.id;

  const generatechatCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    return code;
  };

  const [userChatcodes, setUserChatcodes] = useState<{chatcode: string, companion_id: string}[]>([]);

  const fetchUserCompanionData = async () => {
      try {
          const { data, error } = await supabaseClient
              .from('shared_companions')
              .select('companion_id, my_chatcodes')
              .eq('user_id', userId);

          if (error) {
              console.error('Error fetching user companion data:', error);
              return { companionIds: [], chatcodes: [] };
          }

          const companionIds = data.map(item => item.companion_id);
          return { companionIds };

      } catch (error) {
          console.error('Error in fetchUserCompanionData:', error);
          return { companionIds: [] };
      }
  };

  useEffect(() => {
    const fetchSharedCompanionsRecursively = async (companionIds: string[], fetchedCompanionIds: Set<string> = new Set()): Promise<Companion[]> => {
        setLoadingCompanions(true);
        const newCompanionIds = companionIds.filter(id => !fetchedCompanionIds.has(id));

        if (!newCompanionIds.length) {
            console.log('No new companion IDs provided. Exiting fetch.');
            return [];
        }

        console.log('Fetching companions for companion IDs:', newCompanionIds);

        const { data, error } = await supabaseClient
            .from('companions')
            .select('*')
            .in('companion_id', newCompanionIds);

        if (error) {
            console.error('Error fetching shared companions:', error);
            return [];
        }

        console.log('Companions fetched for current companion IDs:', data);

        newCompanionIds.forEach(id => fetchedCompanionIds.add(id));

        const nextCompanionIds = data.map(companion => companion.companion_id);
        const nextCompanions = await fetchSharedCompanionsRecursively(nextCompanionIds, fetchedCompanionIds);
        setLoadingCompanions(false);
        return [...data, ...nextCompanions];
    };

    const fetchAndSetCompanions = async () => {
        const { companionIds } = await fetchUserCompanionData();
        if (companionIds?.length) {
            const companions = await fetchSharedCompanionsRecursively(companionIds);
            console.log('Final set of companions:', companions);
            setSharedCompanions(companions);
        } else {
            console.log('No companion IDs to fetch companions. Exiting.');
        }
    };

      console.log('Starting the fetching process.');
      fetchAndSetCompanions();

  }, [userId, supabaseClient]);

  useEffect(() => {
      let timeoutId: NodeJS.Timeout | undefined;

      if (loadingCompanions === true && sharedCompanions.length === 0) {
          timeoutId = setTimeout(() => {
              setLoadingCompanions(false);
          }, 2000);
      }

      return () => {
          if (timeoutId) {
              clearTimeout(timeoutId);
          }
      };
  }, []);

  const refreshCompanions = async () => {
    try {
      const { data, error } = await supabaseClient.from('companions').select('*').eq('user_id', userId);
      if (error) {
        console.log('Error refreshing companions:', error);
        return;
      }
      if (data) {
        setCompanions(data);
      }
    } catch (err) {
      console.log('There was an error:', err);
    }
  };

  const createCompanion = async () => {
    let unique = false;
    let chatCode;

    while (!unique) {
      chatCode = generatechatCode();

      const { data, error } = await supabaseClient
        .from('companions')
        .select('chatcode')
        .eq('chatcode', chatCode);

      if (error) {
        console.log('Error checking uniqueness:', error);
        return;
      }

      if (!data.length) {
        unique = true;
      }
    }

    const { error } = await supabaseClient
      .from('companions')
      .insert([
        {
          user_id: userId,
          name: 'New companion',
          description: 'Edit your companion and build your own chatbot!',
          pfp: 'empty.png',
          chatcode: chatCode
        }
      ]);

    if (error) {
      console.log('Error creating companion:', error);
      return;
    }

    await refreshCompanions();
  };

      const fetchCompanions = async () => {
        try {
          const { data, error } = await supabaseClient.from('companions').select('*').eq('user_id', userId);

          if (error) {
            console.log('Error fetching companions:', error);
            return;
          }

          if (data) {
            setCompanions(data);
            console.log('Successfully fetched companions:', data);
          }
        } catch (err) {
          console.log('There was an error:', err);
        }
      };

  const handleCreateCompanionClick = () => {
    setCompanions(undefined);
  };

  const updateCompanionName = async (newName: string) => {
    console.log(selectedCompanionId);
    if (selectedCompanionId) {
      console.log(newName);
      const { error } = await supabaseClient
        .from('companions')
        .update({ name: newName })
        .eq('companion_id', selectedCompanionId);

      if (error) {
        console.log('Error updating companion name:', error);
      } else {
        refreshCompanions();
      }
    }
  };

  const updateCompanionDescription = async (newDescription: string) => {
    if (selectedCompanionId) {
      console.log(newDescription);
      const { error } = await supabaseClient
        .from('companions')
        .update({ description: newDescription })
        .eq('companion_id', selectedCompanionId);

      if (error) {
        console.log('Error updating companion description:', error);
      } else {
        refreshCompanions();
      }
    }
  };

  const selectCompanion = (companion_id: string, name: string, description: string, chatcode: string, pfp: string) => {
    setSelectedCompanion({ companion_id, name, description, chatcode, pfp });
    setCompanionName(name);
    setSelectedCompanionId(companion_id);
    setCompanionDescription(description);
    setCompanionChatcode(chatcode);
    setCompanionPfp(pfp);
    setCreatingCompanion(true);
    setEditName(false);
    setEditDescription(false);
  };

  const [showLimitReached, setShowLimitReached] = useState(false);

  const handleLimitedCreateClick = () => {
    if (companions && companions.length >= 3) {
      setShowLimitReached(true);
      setTimeout(() => setShowLimitReached(false), 2000);
    } else {
      handleCreateCompanionClick();
      createCompanion();
    }
  };

  const handleChatcodeSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const { data: companionData, error: companionError } = await supabaseClient
          .from('companions')
          .select('*')
          .eq('chatcode', localChatcode);

      if (companionError) {
          console.error('Error searching companions by chatcode:', companionError);
          return;
      }

      if (!companionData?.length) {
          console.warn('No companion found with the provided chatcode');
          return;
      }

      const { data: existingRowData, error: existingRowError } = await supabaseClient
          .from('shared_companions')
          .select('*')
          .eq('user_id', userId);

      if (existingRowError) {
          console.error('Error checking for existing rows:', existingRowError);
          return;
      }

      // Loop through all companions associated with the chatcode
      for (const companion of companionData) {
          if (existingRowData?.some(row => row.companion_id === companion.companion_id)) {
              console.error(`User already has a row with the companion_id value: ${companion.companion_id}`);
              continue; // Skip this iteration and move to the next companion
          }

          const { error: insertError } = await supabaseClient
              .from('shared_companions')
              .insert({
                  user_id: userId,
                  my_chatcodes: localChatcode,
                  companion_id: companion.companion_id
              });

          if (insertError) {
              console.error('Error inserting new user data:', insertError);
          } else {
              console.info(`Successfully inserted new row for companion_id: ${companion.companion_id}`);
              setSharedCompanions(prevCompanions => [...prevCompanions, companion]);
          }
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    });
  };

      const handleCompanionSelectClick = (companion: Companion) => () => {

        if(promptConfig){
          setPromptConfig({
            ...promptConfig,
            backendCompanions : {
              ...promptConfig?.backendCompanions,
                cCompanion: companion.companion_id,
                cName: companion.name,
                cChatcode: companion.chatcode,
                cPfp: companion.pfp,
                cDescription: companion.description,
                cIntros: companion.intros,
                cCharacters: companion.characters,
                cExtras: companion.extras
            }
          });
        }
        else{
          setPromptConfig({
            backendCompanions: {
                cCompanion: companion.companion_id,
                cName: companion.name,
                cChatcode: companion.chatcode,
                cPfp: companion.pfp,
                cDescription: companion.description,
                cIntros: companion.intros,
                cCharacters: companion.characters,
                cExtras: companion.extras
            }
          });
        }
          setActiveComponent("Companions");
          setShowCompanions(false);
      };

      const handleRemoveClick = async (companionId: string) => {
          try {
              const { error } = await supabaseClient
                  .from('shared_companions')
                  .delete()
                  .match({ user_id: userId, companion_id: companionId });
              if (!error) {
                  const updatedCompanions = sharedCompanions.filter(comp => comp.companion_id !== companionId);
                  setSharedCompanions(updatedCompanions);
              }
          } catch (error: any) {
              console.error('Error deleting row:', error.message);
          }
      };

      const fetchUserChatcodes = async () => {
          try {
              const { data, error } = await supabaseClient.from('companions').select('chatcode').eq('user_id', userId);
              if (error) throw error;
              if (data) {
                  const uniqueChatcodes = [...new Set(data.map((item) => item.chatcode))];
                  setUserChatcodes(uniqueChatcodes);
              }
          } catch (err) {
              console.error("Error fetching user chatcodes:", err);
          }
      };

      const updateChatcodeForCompanion = async (newChatcode: string) => {
          try {
              setCompanionChatcode(newChatcode);
              const { error } = await supabaseClient
                  .from('companions')
                  .update({ chatcode: newChatcode })
                  .eq('companion_id', selectedCompanionId);
              if (error) throw error;
              refreshCompanions();
          } catch (err) {
              console.error("Error updating chatcode:", err);
          }
      };

      useEffect(() => {
          if (user?.id) {
              fetchCompanions();
              fetchUserChatcodes();
          }
      }, [user?.id]);

      const handleNameKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          updateCompanionName(companionName);
          setEditName(false);
        }
      };

      const handleDescriptionKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          updateCompanionDescription(companionDescription);
          setEditDescription(false);
        }
      };

      const truncateText = (text: string, isMobile: boolean): string => {
        if (isMobile && text.length > 12) {
          return `${text.slice(0, 12)}...`;
        }
        return text;
      };

      const truncateTextDesc = (text: string, isMobile: boolean): string => {
        if (isMobile && text.length > 33) {
          return `${text.slice(0, 33)}...`;
        }
        return text;
      };

      return (
        <Paper w="100%" style={{ height: '100vh', padding: '30px', marginTop: '-40px', position: 'absolute', zIndex: '9' }}>
          {showTextEditor ? (
            <FullScreenTextEditor initialTextAlign="center" />
          ) : showFiles ? (
            <FilesComponent />
          ) : showPrompts ? (
            <PromptsComponent />
          ) : (
            <Tabs defaultValue={getDefaultTab()}>
              <Tabs.List>
                {shouldShowComponent('createCompanions') && (
                  <Tabs.Tab value="myCompanions" icon={<IconMessageChatbot size="0.8rem" />}>
                    Companions
                  </Tabs.Tab>
                )}
                {shouldShowComponent('getCompanions') && (
                  <Tabs.Tab value="sharedWithMe" icon={<IconDownload size="0.8rem" />}>
                    Shared with me
                  </Tabs.Tab>
                )}
              </Tabs.List>

              {shouldShowComponent('createCompanions') && (
        <Tabs.Panel value="myCompanions" pt="xs">
    <Flex>
    {!creatingCompanion && (
    <ActionIcon onClick={() => setShowCompanions(false)} variant="transparent" style={{marginRight:'5px'}} aria-label="Close companions component"
    >
      <IconArrowBack size={20}/>
    </ActionIcon>
    )}
    {creatingCompanion && (
      <ActionIcon onClick={() => setCreatingCompanion(false)} style={{marginRight:'5px'}} variant="transparent" aria-label="Go back to companion list">
        <IconArrowBack size={20}/>
      </ActionIcon>
    )}
        <Badge variant="light" color="blue" style={{transform:'translateY(5px)'}}>
          {companions ? `${companions.length}/3 total companions` : 'Loading...'}
        </Badge>
        {companions && companions.length > 0 && (
            <Button
            size="xs"
              variant="default"
              disabled={showLimitReached}
              onClick={handleLimitedCreateClick}
              style={{ transform: 'translateY(0px)', right:0, float:'right', marginLeft:'15px' }}
              rightIcon={<IconPlus size={20} />}
            >
              {showLimitReached ? "3/3 companions!" : "Create companion"}
            </Button>
        )}
        </Flex>
    {companions && companions.length === 0 && (
      <Flex style={{ height: '60vh' }} justify="center" align="center" direction="column">
        <img src="general/companions_filler.png" alt="Create a companion!" style={{width:'300px'}}/>
        <Button
          variant="light"
          disabled={showLimitReached}
          onClick={handleLimitedCreateClick}
          style={{ transform: 'translateY(8px)'}}
          rightIcon={<IconPlus size={20} />}
        >
          Create companion
        </Button>
      </Flex>
    )}
    <ScrollArea scrollbarSize={2} scrollHideDelay={0} style={{ padding: '10px', marginTop:'20px', height:'75vh', paddingBottom:'65px'}}>
    <Flex direction={isMobile ? 'column' : 'row'} style={{ width: '100%' }}>
    {creatingCompanion && (
      <>
        <Flex direction="row" w="100%" align="flex-start" style={{ marginTop: '10px', transform: isMobile ? 'translateX(0px)' : 'translateX(50px)' }}>
          <Flex direction="column" align="center" style={{ marginRight: "15px" }}>
          {
            pfpUploads || companionPfp === '' ? (
          <img
            alt="Companion Profile"
            src={
              `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/spark-menu-bucket/companions/${pfpUploads || companionPfp}`
            }
            style={{ width: '100px', height: '100px', border: '2px solid rgba(160,160,160,0.45)', borderRadius: '100%' }}
          />
            ) : (
              <Box style={{width:'100px', height:'100px'}}>
                <ThemeIcon style={{ width: '100px', height: '100px', borderRadius:'100%'}} variant="outline" color="gray">
                  <IconPhoto size={50}/>
                </ThemeIcon>
              </Box>
            )
          }
            <Button size="xs" rightIcon={<IconPhotoPlus />} onClick={() => setIsImgDropzoneOpen(true)} style={{ marginTop: "10px" }}>Add image</Button>
          </Flex>
          <Flex direction="column" justify="flex-start">
            <Flex align="center" style={{ width: '100%' }}>
            {editName ? (
              <>
                <ActionIcon
                  variant="transparent"
                  onClick={() => {
                    updateCompanionName(companionName);
                  }}
                  aria-label="Save companion name">
                  <IconCheck />
                </ActionIcon>
                <TextInput
                  maxLength={40}
                  style={{ width: '80%' }}
                  placeholder="Companion name"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.currentTarget.value)}
                  onBlur={() => {
                      updateCompanionName(companionName);
                      setEditName(false)
                    }}
                  onKeyPress={handleNameKeyPress}
                />
              </>
              ) : (
                <>
                  <ActionIcon
                    variant="transparent"
                    onClick={() => setEditName(true)}
                    aria-label="Edit companion name">
                    <IconPencil />
                  </ActionIcon>
                  <Title style={{ fontSize: isMobile ? '16px' : 'inherit' }}>{companionName}</Title>
                </>
              )}
            </Flex>
            <Flex align="center" style={{ width: '100%' }}>
            {editDescription ? (
              <>
                <ActionIcon
                  variant="transparent"
                  onClick={() => {
                    updateCompanionDescription(companionDescription);
                  }}
                  aria-label="Save companion description">
                  <IconCheck />
                </ActionIcon>
                <TextInput
                  maxLength={90}
                  placeholder="Companion description"
                  style={{ width: '80%', marginTop: '6px' }}
                  onChange={(e) => setCompanionDescription(e.currentTarget.value)}
                  value={companionDescription}
                  onBlur={() => {
                      updateCompanionDescription(companionDescription);
                      setEditDescription(false)}}
                  onKeyPress={handleDescriptionKeyPress}
                />
              </>
              ) : (
                <>
                  <ActionIcon
                    variant="transparent"
                    onClick={() => setEditDescription(true)}
                    aria-label="Edit companion description">
                    <IconPencil />
                  </ActionIcon>
                  <Text size="xs" style={{ marginTop: '10px', width: '160px' }}>{companionDescription}</Text>
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
      </>
    )}
    {creatingCompanion && (
      <Paper style={{padding:'20px', transform:isMobile ? 'translateY(25px)' : 'translateX(-50px)'}} shadow="xs" withBorder>
      <Flex direction="column">
        <Flex direction="row" style={{left:0}}>
          <Text size="xl" weight={700}>
            Chatcode
          </Text>
          <Flex direction="row" justify="flex-end" style={{right:0, padding:'10px', transform:'translateY(-6px)'}}>
          <Select
              style={{marginTop:'-5px'}}
              data={userChatcodes.map(code => ({ value: code.chatcode, label: code.chatcode }))}
              value={companionChatcode}
              onChange={value => {
                  if (value) {
                      updateChatcodeForCompanion(value);
                  }
              }}
          />
          <ActionIcon
              onClick={() => copyToClipboard(companionChatcode)}
              aria-label="Copy chatcode to clipboard"
          >
              {copySuccess ? <IconCheck /> : <IconClipboard />}
          </ActionIcon>
          </Flex>
        </Flex>
        <Text size="sm">
          Share this chatcode with whomever you would like so they can use your Companion
        </Text>
      </Flex>
      </Paper>
    )}
</Flex>
      <Box style={{height:'100%'}}>
      {creatingCompanion ? (
          <Paper style={{ padding: '20px', marginTop: '15px' }} shadow="xs" withBorder>
              <Flex justify="space-between" direction="column">
                  <Flex direction="column" style={{ marginRight: '20px', cursor:'pointer', borderBottom:'1px solid rgba(160,160,160,0.13)', paddingBottom:'20px' }} onClick={() => setShowTextEditor(true)}>
                      <Flex align="center" style={{ marginTop: '6px' }}>
                          <Box style={{ transform: 'translateY(2.8px)' }}>
                              <IconBrain size={20} />
                          </Box>
                          <Text weight={700} style={{ marginLeft: '4px' }}>Memories</Text>
                          <Flex justify="flex-end" style={{width:'100%'}}>
                            <IconChevronRight size={20} />
                          </Flex>
                      </Flex>
                      <Text size="xs" style={{ marginTop: '6px', width: '84%', opacity:0.7 }}>
                          Write manual memories to the chatbot or upload files.
                      </Text>
                  </Flex>
                  <Flex direction="column" style={{ marginRight: '20px', cursor:'pointer', borderBottom:'1px solid rgba(160,160,160,0.13)', paddingBottom:'20px'}} onClick={() => setShowFiles(true)}>
                      <Flex align="center" style={{ marginTop: '8px', marginBottom:'6px' }}>
                          <Box style={{ transform: 'translateY(2.8px)' }}>
                              <IconUpload size={20} />
                          </Box>
                          <Text weight={700} style={{ marginLeft: '4px' }}>Files</Text>
                          <Flex justify="flex-end" style={{width:'100%'}}>
                            <IconChevronRight size={20} />
                          </Flex>
                      </Flex>
                      <Text size="xs" style={{ marginTop: '4.5px', width: '84%', opacity:0.7 }}>
                          Upload files and embed them into the memory.
                      </Text>
                      <Flex direction="column">
                        {uploadedFiles.map((file, index) => (
                          <Flex key={index} align="center">
                            {getFileIcon(file)}
                            <Text>{file}</Text>
                          </Flex>
                        ))}
                      </Flex>
                  </Flex>
                  <Flex direction="column" style={{ marginRight: '20px', cursor:'pointer' }}  onClick={() => setShowPrompts(true)}>
                      <Flex align="center" style={{ marginTop: '8px', marginBottom:'6px' }}>
                          <Box style={{ transform: 'translateY(2.8px)' }}>
                              <IconRobot size={20} />
                          </Box>
                          <Text weight={700} style={{ marginLeft: '4px' }}>Prompt</Text>
                          <Flex justify="flex-end"  style={{width:'100%'}}>
                            <IconChevronRight size={20} />
                          </Flex>
                      </Flex>
                      <Text size="xs" style={{ marginTop: '4.5px', width: '80%', opacity:0.7 }}>
                          Set up to 3 prompts to pass through to the AI with every response
                      </Text>
                  </Flex>
              </Flex>
          </Paper>
      ) : companions === undefined ? (
        <div>
          <StyledLoader />
        </div>
      ) : (
        <>
            {companions.map((companion) => (
                <Paper
                    key={companion.companion_id}
                    style={{ margin: '10px', padding: '20px' }}
                    shadow="xs"
                    withBorder
                >
                <Flex>
                    <Flex align="flex-start" w="100%">
                    {
                      companion.pfp != '' && companion.pfp != 'empty.png' ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/spark-menu-bucket/companions/${companion.pfp}`}
                          alt={`${companion.name}'s profile`}
                          style={{ width: '50px', height: '50px', border:'2px solid rgba(160,160,160,0.45)', borderRadius:'100%'}}
                        />
                      ) : (
                        <Box style={{width:'50px', height:'50px'}}>
                          <ThemeIcon style={{ width: '50px', height: '50px', borderRadius:'100%', transform:'translateY(1.25vh)'}} variant="outline" color="gray">
                            <IconPhoto />
                          </ThemeIcon>
                        </Box>
                      )
                    }

                        <Flex direction="column" style={{marginLeft:'10px'}}>
                          <Text size="sm" weight={700}>
                            {truncateText(companion.name, isMobile)}
                          </Text>
                            <Text size="xs" style={{paddingRight:'7px', opacity: 0.8}}>
                            {truncateTextDesc(companion.description, isMobile)}
                            </Text>
                            <Text size="xs" style={{ fontSize: '10px', opacity: 0.6, right: 0, top: 0, transform: 'translateY(1.5px)' }}>
                                {new Date(companion.created_at).toLocaleDateString()}
                            </Text>
                        </Flex>
                    </Flex>
                    <Flex direction="column" align="flex-end">
                        <Button
                            rightIcon={<IconPencil />}
                            size="xs"
                            color="dark"
                            onClick={() => selectCompanion(companion.companion_id, companion.name, companion.description, companion.chatcode, companion.pfp)}
                            style={{ marginBottom: '10px' }}
                        >
                            Edit
                        </Button>
                        <Button
                            size="xs"
                            rightIcon={<IconBrandSpeedtest />}
                            onClick={handleCompanionSelectClick(companion)}
                        >
                            Test
                        </Button>
                    </Flex>
                    </Flex>
                </Paper>
            ))}
        </>
      )}
      </Box>
      </ScrollArea>
      </Tabs.Panel>
    )}
    {shouldShowComponent('getCompanions') && (
      <Tabs.Panel value="sharedWithMe" pt="xs">
        <Flex>
        {!creatingCompanion && (
          <ActionIcon onClick={() => setShowCompanions(false)} variant="transparent" style={{marginRight:'5px'}} aria-label="Close companions component"
          >
            <IconArrowBack size={20}/>
          </ActionIcon>
        )}
          <Badge variant="light" color="blue" style={{transform:'translateY(5px)'}}>
            {sharedCompanions ? `${sharedCompanions.length} shared companions` : 'Loading...'}
          </Badge>
        </Flex>
        <Flex style={{marginTop:'7.5px'}}>
          {sharedCompanions && sharedCompanions.length > 0 && (
            <>
            <TextInput
                value={localChatcode}
                onChange={(e) => setLocalChatcode(e.target.value)}
                placeholder="Enter Chatcode..."
                label="Chatcode"
            />
            <Button onClick={handleChatcodeSubmit} style={{ marginLeft:'7.5px', transform:'translateY(24px)' }}>
                Submit
            </Button>
            </>
          )}
        </Flex>
        {loadingCompanions && sharedCompanions.length === 0 ? (
          <div>
            <StyledLoader />
          </div>
        ) : sharedCompanions.length === 0 ? (
          <Flex style={{ height: '60vh' }} justify="center" align="center" direction="column">
            <img src="general/shared_companions_filler.png" alt="Add a shared companion!" style={{width:'300px'}}/>
            <Flex style={{marginTop:'-15px', marginBottom:'15px'}}>
            <TextInput
                value={localChatcode}
                onChange={(e) => setLocalChatcode(e.target.value)}
                placeholder="Enter Chatcode..."
                label="Get companions"
            />
            <ActionIcon onClick={handleChatcodeSubmit} size="lg" variant="light" color="blue" style={{ marginLeft:'7.5px', transform:'translateY(24px)' }}>
                <IconDownload size={20}/>
            </ActionIcon>
            </Flex>
          </Flex>
        ) : (
          <ScrollArea scrollbarSize={2} scrollHideDelay={0} style={{ height: 'calc(100vh - 150px)', marginTop: '10px', paddingBottom:'100px' }}>
              {sharedCompanions?.map((companion) => (
                  <Paper
                      key={companion.companion_id}
                      style={{ margin: '10px', padding: '20px' }}
                      shadow="xs"
                      withBorder
                  >
                  <Flex>
                      <Flex align="flex-start" w="100%">
                      {
                        companion.pfp != '' && companion.pfp != 'empty.png' ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/spark-menu-bucket/companions/${companion.pfp}`}
                            alt={`${companion.name}'s profile`}
                            style={{ width: '50px', height: '50px', border:'2px solid rgba(160,160,160,0.45)', borderRadius:'100%'}}
                          />
                        ) : (
                          <ThemeIcon style={{ width: '50px', height: '50px', borderRadius:'100%', transform:'translateY(1.25vh)'}} variant="outline" color="gray">
                            <IconPhoto />
                          </ThemeIcon>
                        )
                      }
                          <Flex direction="column" style={{marginLeft:'10px'}}>
                            <Text size="sm" weight={700}>
                              {truncateText(companion.name, isMobile)}
                            </Text>
                              <Text size="xs" style={{paddingRight:'7px', opacity: 0.8}}>
                              {truncateTextDesc(companion.description, isMobile)}
                              </Text>
                              <Text size="xs" style={{ fontSize: '10px', opacity: 0.6, right: 0, top: 0, transform: 'translateY(1.5px)' }}>
                                  {new Date(companion.created_at).toLocaleDateString()}
                              </Text>
                          </Flex>
                      </Flex>
                      <Flex direction="column" align="flex-end">
                          <Button
                              size="xs"
                              rightIcon={<IconMessageChatbot />}
                              onClick={handleCompanionSelectClick(companion)}
                              style={{ marginBottom:'10px', width:'110px'}}
                          >
                              Chat
                          </Button>
                          <ActionIcon
                              size="xs"
                              style={{opacity:'0.75'}}
                              onClick={() => handleRemoveClick(companion.companion_id)}
                          >
                              <IconTrash />
                          </ActionIcon>
                        </Flex>
                      </Flex>
                  </Paper>
              ))}
          </ScrollArea>
        )}
      </Tabs.Panel>
    )}
    </Tabs>
    )}
    <Modal opened={isImgDropzoneOpen} onClose={() => setIsImgDropzoneOpen(false)} style={{zIndex:'99999'}}>
      <ImgDropzone />
    </Modal>
    </Paper>
  );
}
