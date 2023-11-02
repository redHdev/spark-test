import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ActionIcon, Text, ScrollArea, Box, Flex, Center, Title, Alert, Loader, ThemeIcon } from "@mantine/core";
import { useCompletion } from 'ai/react';
import Image from 'next/image';
import { IconX, IconSend, IconPhoto, IconAlertCircle, IconClipboard, IconCheck } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { Markdown } from './markdown';
import styled from 'styled-components';
import icons, { IconNames } from '../icons/icons';
import { useMessages } from '../../context/MessageContext';
import { lighten } from 'polished';
import Cookies from 'js-cookie';
import { useIntl } from 'react-intl';
import { Textarea } from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { useCreateConversation } from './functions/useCreateConversation';
import { useConversationEmbedding } from './functions/useConversationEmbedding';
import { useAIResponseEmbedding } from './functions/useAIResponseEmbedding';
import { useUpdateModLastUsed } from './functions/useUpdateModLastUsed';
import { fetchGameState } from './functions/useGetGameState';
import { handleFunctionCall, gameStateIm } from './states/gameState';
import { useUpdateGameState } from './functions/useUpdateGameState';
import { testStateIm, handleTestFunctionCall } from './states/testState';
import { useUpdateTestState } from './functions/useUpdateTestState';

import { usePrompt } from "../../context/PromptConfig";

import Gamebar from './addons/gamebar';
import Testbar from './addons/testbar';

import { useUser } from '@supabase/auth-helpers-react';

const CustomTextarea = styled(Textarea)`
    background: rgba(100,100,100,0.08) !important;
    textarea {
        background: rgba(100,100,100,0.08) !important;
    }
`;

const SendButtonContainer = styled.div`
    position: relative;
`;

const ActionButtonContainer = styled.div`
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
`;

interface MessageContainerProps {
  $isfromuser: boolean;
}

interface Message {
  sender: string;
  content: string;
}

const MessageContainer = styled.div<MessageContainerProps>`
  margin: 3px;
  padding: 5px;
  border-bottom: 1px solid rgba(160,160,160,0.08);
  width:98.4%;
  background-color: ${props => props.$isfromuser ? 'transparent' : 'rgba(160,160,160,0.08)'};
  word-wrap: break-word;
`;

export function SparkGPT() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState<string>("");
  const [history, setHistory] = useState<Array<{ user?: string, ai?: string }>>([]);
  const { complete, completion, isLoading } = useCompletion({
    api: `/api/vector-search`,
  });
  const { createConversation } = useCreateConversation();
  const conversationEmbedding = useConversationEmbedding();
  const aiResponseEmbedding = useAIResponseEmbedding();
  const updateModLastUsed = useUpdateModLastUsed();
  const user = useUser();
  const userId = user?.id;
  const scrollRef = useRef<HTMLDivElement>(null);
  const intl = useIntl();
  const { messagesData } = useMessages();
  const isMobile = useMediaQuery("(max-width: 480px)");
  const avatarUrl = user?.user_metadata ?.avatar_url;
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [editedMessage, setEditedMessage] = useState<string>("");
  const [scrollAreaHeight, setScrollAreaHeight] = useState('60vh');
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [timestamps, setTimestamps] = useState<Date[]>([]);
  const [gameState, setGameState] = useState(null);
  const [chatbotJsonData, setChatbotJsonData] = useState(null);
  const { updateGameState } = useUpdateGameState();
  const { updateTestState } = useUpdateTestState();
  const [testState, setTestState] = useState(null);
  const adminUserId = '95953152-6e6a-4ac4-9f67-9dda8fc4c134'
  const [isAdmin, setIsAdmin] = useState(false);

  const {promptConfig, setPromptConfig} = usePrompt();

  useEffect(() => {
    if (userId === adminUserId) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [adminUserId, userId])

  let xIcon: any;
  let iconColor: any;
  let xTitle: any;

  let showGamebar = false;
  if (promptConfig?.backendMods) {
    const backendModData = promptConfig.backendMods;
    xIcon = backendModData?.xIcon;
    iconColor = backendModData?.iconColor;
    xTitle = backendModData?.xTitle;
    if (backendModData?.xRpg === 'true') {
      showGamebar = true;
    }
  }

  let companionCookieId: any;
  let showTestbar = false;
  if (promptConfig?.backendCompanions) {
    companionCookieId = promptConfig?.backendCompanions.cCompanion;
    if (promptConfig.backendCompanions.cTest === 'true') {
      showTestbar = true;
    }
  }



  useEffect(() => {
    if (messagesData && messagesData.messages) {
      const newHistory: Array<{ user?: string, ai?: string }> = [];
      const userMessages: string[] = [];
      const aiMessages: string[] = [];

      messagesData.messages.forEach((msg: Message) => {
        if (msg.sender === "user") {
          userMessages.push(msg.content);
        } else {
          aiMessages.push(msg.content);
        }
      });
      for (let i = 0; i < userMessages.length; i++) {
        newHistory.push({ user: userMessages[i], ai: aiMessages[i] });
      }
      newHistory.pop();

      setHistory(newHistory);
    }
  }, [messagesData]);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

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
              // Extract alpha value from the color, you can adjust this value as per your requirements
              const a = 0.3;
              // Convert rgba to hex considering opacity on a white background
              rgbaIconColor = blendWithWhite(r, g, b, a);
            }
          }
      }
    } else {
      XIcon = IconX;
    }

    return (
      XIcon ? (
        <Box style={{ backgroundColor: rgbaIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6%', borderRadius: '7px', height:'31px', width:'31px' }}>
          <XIcon size={24} color={color} />
        </Box>
      ) : (
          <div>Icon: {name} not found</div>
      )
    );
  };

  useEffect(() => {
    const settingsOpen = Cookies.get('settings-open');
    if (settingsOpen) {
      setScrollAreaHeight('0');
    } else {
      setScrollAreaHeight('65vh');
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        setOpen(true);
      }
      if (e.key === "Escape") {
        handleModalToggle();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  const handleModalToggle = () => {
    setOpen(!open);
    setQuery("");
  };

  const [showAlert1, setShowAlert1] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const onSubmit = (e: React.SyntheticEvent) => {
      e.preventDefault();

      if (isResponding || isLoading) {
          setShowAlert1(true);
          return;
      }

      setIsResponding(true);

      const currentTimestamp = new Date();

        const updatedTimestamps = [currentTimestamp, ...timestamps].slice(0, 3);

        const currentTimestampText = `Time of message: ${updatedTimestamps[0]?.toLocaleString() || currentTimestamp.toLocaleString()}\n`;
        const lastTimestampText = updatedTimestamps[1] ? `Last message sent: ${updatedTimestamps[1].toLocaleString()}\n` : "";
        const secondLastTimestampText = updatedTimestamps[2] ? `Second last message sent: ${updatedTimestamps[2].toLocaleString()}\n` : "";

        const formattedQuery = `
        ${currentTimestampText}
        ${lastTimestampText}
        ${secondLastTimestampText}

        User message: ${query}`;

        if(promptConfig){
          setPromptConfig({
            ...promptConfig,
            backendMods: {
              ...promptConfig?.backendMods,
              xIcon: "robot",
              xTags: ["settings", "default", "general"],
              xType: "character",
              xTitle: "Default Settings",
              xAuthor: "Spark Team",
              xPrompt: "You are SparkGPT. You are the expanded version of ChatGPT. Users can: 1. Change the system prompt to whatever they'd like (create characters, personalities, etc.) 2. Change temperature, max tokens and other settings 3. Use GPT 4 and GPT 3.5 Turbo (16k) free for a limited time 4. Use text-to-speech and speech-to-textarea and 5. And all sorts of other things! Current date and time: {{ datetime }}",
              xProduct: "sparkgpt",
              iconColor: "blue",
              xDescription: "Default system settings for SparkGPT with FAQ.",
            }
          });
        }
        else{
          setPromptConfig({
            backendMods: {
              xIcon: "robot",
              xTags: ["settings", "default", "general"],
              xType: "character",
              xTitle: "Default Settings",
              xAuthor: "Spark Team",
              xPrompt: "You are SparkGPT. You are the expanded version of ChatGPT. Users can: 1. Change the system prompt to whatever they'd like (create characters, personalities, etc.) 2. Change temperature, max tokens and other settings 3. Use GPT 4 and GPT 3.5 Turbo (16k) free for a limited time 4. Use text-to-speech and speech-to-textarea and 5. And all sorts of other things! Current date and time: {{ datetime }}",
              xProduct: "sparkgpt",
              iconColor: "blue",
              xDescription: "Default system settings for SparkGPT with FAQ.",
            }
          });
        }

        createConversation()
            .then(() => {
              setHistory((prev) => [...prev, { user: query, ai: '' }]);
              setQuery("");
            })
            .then(() => updateModLastUsed())
            .then(() => conversationEmbedding.handleEmbeddingCreation(formattedQuery))
            .then(() => {
                const path = window.location.pathname;
                const id = path.split('/chat/')[1];
                return fetchGameState(id);
            })
            .then(({ loading: fetchedLoading, gameState: fetchedGameState, fetchError: fetchedError }) => {
                setGameState(fetchedGameState);
                if (fetchedError) {
                    console.error('Fetching error:', fetchedError);
                }
            })
            .then(() => {
              const delayIsResponding = new Promise((resolve) => {
                setTimeout(() => {
                  setIsResponding(false);
                  resolve(null);
                }, 1000);
              });

              const completeCall = complete(JSON.stringify({
                query : formattedQuery,
                promptConfig : promptConfig
              }))
              .then(() => {
                const lastAiMessage = history[history.length - 1]?.ai;
                if (lastAiMessage) {
                  const aiResponseTimestamp = new Date();

                  const aiCurrentTimestampText = `Time of message: ${aiResponseTimestamp.toLocaleString()}\n`;
                  const aiLastTimestampText = `Last message sent: ${updatedTimestamps[0].toLocaleString()}\n`;
                  const aiSecondLastTimestampText = updatedTimestamps[1] ? `Second last message sent: ${updatedTimestamps[1].toLocaleString()}\n` : "";

                  const formattedCompletion = `
                  ${aiCurrentTimestampText}
                  ${aiLastTimestampText}
                  ${aiSecondLastTimestampText}

                  AI response: ${lastAiMessage}`;

                  aiResponseEmbedding.handleAIResponseEmbedding(formattedCompletion);
                } else {
                  console.log("did not work");
                }
              });

              return Promise.all([delayIsResponding, completeCall]);
            })
            .finally(() => {
                setIsResponding(false);
            })
            .catch((error) => {
                console.error('An error occurred:', error);
            });

          setTimestamps(prev => {

            const updatedTimestamps = [currentTimestamp, ...prev].slice(0, 3);

            return updatedTimestamps;
          });
  };

  useEffect(() => {
    if (showAlert1) {
      const timer = setTimeout(() => {
        setShowAlert1(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert1]);

  function extractJsonFromCompletion(completion: string): { xmessage: string, jsonData: any | null } {
    const beginDelimiter = "<!>";
    const endDelimiter = "</!>";

    const beginIndex = completion.indexOf(beginDelimiter);

    if (beginIndex !== -1) {
      const endIndex = completion.indexOf(endDelimiter);
      let jsonStr = "";

      if (endIndex === -1) {
        jsonStr = completion.substring(beginIndex + beginDelimiter.length);
      } else {
        jsonStr = completion.substring(beginIndex + beginDelimiter.length, endIndex);
      }

      try {
        return {
          xmessage: completion.substring(0, beginIndex).trim(),
          jsonData: JSON.parse(jsonStr)
        };
      } catch (err) {
        console.error("Error parsing JSON:", err);
        return { xmessage: completion, jsonData: null };
      }
    } else {
      return {
        xmessage: completion,
        jsonData: null
      };
    }
  }

  useEffect(() => {
    if (completion) {
        const { xmessage, jsonData } = extractJsonFromCompletion(completion);
        if (chatbotJsonData === null) {
          setChatbotJsonData(jsonData);
        }
        setHistory((prev) => {
          const copy = [...prev];
            copy[copy.length - 1].ai = xmessage;
          return copy;
        });
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [completion]);

  function mergeWithTemplate(template: typeof gameStateIm, fetchedState: any): typeof gameStateIm {
      return {
          xp: fetchedState.xp || template.xp,
          health: fetchedState.health || template.health,
          bankroll: fetchedState.bankroll || template.bankroll,
          bag: fetchedState.bag || template.bag,
          shop: fetchedState.shop || template.shop
      };
  }

  function mergeWithTestTemplate(template: typeof testStateIm, fetchedState: any): typeof testStateIm {
      return {
          incorrect: fetchedState.incorrect || template.incorrect,
          correct: fetchedState.correct || template.correct,
      };
  }

  const resetChatbotData = () => {
      setChatbotJsonData(null);
  };

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
      if (chatbotJsonData) {
          let baseState = mergeWithTemplate(gameStateIm, gameStateRef.current);
          Object.entries(chatbotJsonData).forEach(([fullFuncName, funcArgs]) => {
              const funcName = fullFuncName.split('.')[1];
              if (funcName) {
                  baseState = handleFunctionCall(funcName, funcArgs, baseState);
              }
          });

          const path = window.location.pathname;
          const conversationId = path.split('/chat/')[1];
          updateGameState(baseState, conversationId);
          resetChatbotData();
      }
  }, [chatbotJsonData, updateGameState]);

  const testStateRef = useRef(testState);
  testStateRef.current = testState;

  useEffect(() => {
      if (chatbotJsonData) {
          let baseTestState = mergeWithTestTemplate(testStateIm, testStateRef.current);

          Object.entries(chatbotJsonData).forEach(([fullFuncName, funcArgs]) => {
              const funcName = fullFuncName.split('.')[1];
              if (funcName) {
                  baseTestState = handleTestFunctionCall(funcName, funcArgs, baseTestState);
              }
          });

          const id = companionCookieId ?? null;
          updateTestState(baseTestState, id);
          resetChatbotData();
      }
  }, [chatbotJsonData, updateTestState]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  }, []);
  const hotkeyHandler = useMemo(() => {
    const keys = [
      ['Escape', handleModalToggle, { preventDefault: true }],
      ['Enter', onSubmit, { preventDefault: true }],
    ];
    const handler = getHotkeyHandler(keys as any);
    return handler;
  }, [onSubmit, handleModalToggle]);

  useEffect(() => {
    const originalOverflowY = window.getComputedStyle(document.body).overflowY;
    const originalOverflowX = window.getComputedStyle(document.body).overflowX;

    document.body.style.overflowY = 'hidden';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.body.style.overflowY = originalOverflowY;
      document.body.style.overflowX = originalOverflowX;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingMessageIndex !== null && e.target && !(e.target as Element).closest('.edit-box')) {
        handleCancelEdit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingMessageIndex]);

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditingContent("");
  };

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current) return;
      const isAtBottom = scrollAreaRef.current.scrollHeight - scrollAreaRef.current.scrollTop === scrollAreaRef.current.clientHeight;
      setAutoScroll(isAtBottom);
    };
    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history]);

  useEffect(() => {
    if (editedMessage !== "") {
      complete(editedMessage);
      setEditedMessage("");
    }
  }, [editedMessage, complete]);

  const copyToClipboard = (str: string, index: number) => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    setCopiedMessageIndex(index);

    setTimeout(() => {
      setCopiedMessageIndex(null);
    }, 2000);
  };

  useEffect(() => {
    const handleFocusOut = () => {
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusout', handleFocusOut);
    }
  }, []);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
      const handleFocusIn = () => {
          if (window.innerWidth <= 768) {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }
      }

      inputRef.current?.addEventListener('focus', handleFocusIn);

      return () => {
          inputRef.current?.removeEventListener('focus', handleFocusIn);
      }
  }, []);

  function processMessage(content: string | undefined): string {
      if (!content) {
          return '';
      }

      if (content.includes('User message:')) {
          return content.split('User message:')[1].trim();
      }

      if (content.includes('AI response:')) {
        return content.split('AI response:')[1].trim();
      }

      return content;
  }

  let companion: any = null;
  if (promptConfig?.backendCompanions) {
      companion = promptConfig.backendCompanions;
  }

  return (
    <Box style={{padding:'0px', width:'100%', marginTop:'-2vh'}}>
      <form onSubmit={onSubmit}>
      <ScrollArea
        viewportRef={scrollAreaRef}
        type="never"
        style={{
          marginBottom: '5px',
          height: scrollAreaHeight,
          width: '100%',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
          {history.length === 0 ? (
            <>
              <Center style={{height: '50vh'}}>
                <Flex align="center" justify="center" style={{marginTop:'7vh'}}>
                  <Flex direction="column" justify="center">
                    <Flex justify="center">
                      <Title style={{opacity:'0.2', fontSize:'50px'}}>SPARK</Title>
                      <Title style={{color:'#153B89', fontSize:'50px', opacity:'0.5'}}>4</Title>
                    </Flex>
                    <Text size="sm" style={{width:"300px", opacity:'0.5', textAlign:'center', paddingTop:'10px', borderTop:'1px solid rgba(160,160,160,0.82)', marginTop:'5px'}}>Spark Engine may produce innacurate information about people, places or facts.</Text>
                  </Flex>
                </Flex>
              </Center>
            </>
          ) : (
            history.map((message, i, arr) => (
              <div key={i}>
                <MessageContainer $isfromuser={true}>
                      <Flex direction="row" w="100%">
                      {avatarUrl && <img src={avatarUrl} alt="user image" width={30} height={30} style={{borderRadius:'100%'}}/>}
                      {!avatarUrl && <img src="/favicon.ico" alt="user image" width={30} height={30} style={{border:'1px solid', borderRadius:'100%'}}/>}
                      <div style={{ marginLeft: '10px', flex: '1', transform: 'translateY(-2vh)' }}>
                      {message.user && <Markdown content={processMessage(message.user)} />}
                      </div>
                    </Flex>
                </MessageContainer>
                <MessageContainer $isfromuser={false}>
                   <Flex direction="row" w="100%">
                   {
                       companion && (companion.cPfp || companion.cPfp !== 'empty.png') ? (
                           <img
                               src={`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/spark-menu-bucket/companions/${companion.cPfp || 'empty.png'}`}
                               alt="Companion image"
                               style={{ width: '25px', height: '25px', borderRadius:'100%'}}
                           />
                       ) : xIcon && iconColor ? (
                           renderIcon(xIcon, iconColor)
                       ) : companion ? (
                           <ThemeIcon style={{ width: '25px', height: '25px', borderRadius:'100%'}} variant="outline" color="gray">
                               <IconPhoto size={15}/>
                           </ThemeIcon>
                       ) : (
                           <Image src="/favicon.ico" alt="ai image" width={30} height={30} />
                       )
                   }
                       <Flex direction="column" w="100%">
                           <Text style={{fontWeight:'bold', transform:'translateX(3.5px)', marginLeft:'7px'}}>
                               {companion ? companion.cName : xTitle}
                           </Text>
                           <div style={{ marginLeft: '10px', flex: '1', transform: 'translateY(-1.5vh)', paddingRight:'7vw'}}>
                               {isResponding && i === arr.length - 1 ? (
                                   <div style={{ marginTop: '7px', marginLeft: '3px', opacity:'0.5', height:'10px', filter:'grayscale(100%)' }}>
                                      <Loader size="sm" variant="dots" />                                   </div>
                               ) : null}
                               {message.ai && <Markdown content={processMessage(message.ai)} />}
                           </div>
                   </Flex>
                <div style={{position:'relative'}}>
                <div style={{ position: 'absolute', top: '5px', right: '1.5vw' }}>
                <ActionIcon
                  variant="transparent"
                  onClick={() => copyToClipboard(message.ai || '', i)}
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  {copiedMessageIndex === i ? <IconCheck size={15}/> : <IconClipboard size={15}/>}
                </ActionIcon>
                </div>
                </div>
                </Flex>
                </MessageContainer>
              </div>
            ))
          )}
        </ScrollArea>
        {showGamebar && <Gamebar gameState={{ xp: 0, health: 4, bankroll: 0, bag: [], shop: [] }} />}
        {showTestbar && <Testbar />}
            <Box sx={(theme) => ({
                  padding: theme.spacing.xs,
                })}
                style={{bottom:0, transform:showGamebar || showTestbar ? 'translateY(-40px)' : 'translateY(0px)'}}>
                            <SendButtonContainer>
              <CustomTextarea
                id="message-input"
                autosize
                minRows={isMobile ? 1 : 2}
                maxRows={12}
                placeholder={intl.formatMessage({ id: "messageInput.placeholder", defaultMessage: "Enter your message here..." })}
                value={query}
                onChange={onChange}
                onKeyDown={hotkeyHandler}
                ref={inputRef}
              />
              <ActionButtonContainer>
                  <ActionIcon
                      onClick={onSubmit}
                      aria-label="Send message"
                      size="lg"
                      variant="subtle"
                      color="blue"
                  >
                  <IconSend size="1rem" />
                  </ActionIcon>
              </ActionButtonContainer>
            </SendButtonContainer>
          </Box>
        </form>
        {showAlert1 && (
            <FadingAlert style={{width:'100%'}}>
                <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="filled">
                    Please wait for the last response to finish before sending your next message
                </Alert>
            </FadingAlert>
        )}
    </Box>
  );
}

const FadingAlert = styled.div`
    position: absolute;
    top: 0;
    width: 100%;
`;
