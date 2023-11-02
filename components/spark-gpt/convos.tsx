import React, { useState, useEffect } from 'react';
import { Paper, Text, Select, ScrollArea, Menu, Flex, Box, ActionIcon } from '@mantine/core';
import { IconTrash, IconSend, IconX, IconDots } from '@tabler/icons-react';
import icons, { IconNames } from '../icons/icons';
import { lighten } from 'polished';
import { useConvoFetcher } from './functions/useConvoFetcher';
import { useGetMessagesByConvoId } from './functions/useGetMessagesByConvoId';
import { useMessages } from '../../context/MessageContext';
import { usePrompt } from '../../context/PromptConfig';

import Cookies from 'js-cookie';

interface ConversationProps {
  conversation_id: string;
  title: string;
  time: string;
  xIcon: string;
  iconColor: string;
  xPrompt: string;
  xLoader?: string;
  xTitle: string;
}

const ConversationComponent: React.FC = () => {
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest' | 'alphabetical' | 'reverse-alphabetical'>('newest');
  const [conversations, setConversations] = useState<ConversationProps[]>([]);
  const [scrollAreaHeight, setScrollAreaHeight] = useState('60vh');
  const { myConversations } = useConvoFetcher();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { setMessagesData } = useMessages();
  const { messages, loading: messagesByConvoLoading, error: messagesByConvoError } = useGetMessagesByConvoId(selectedConversationId || "");
  const sortConversations = (order: 'oldest' | 'newest' | 'alphabetical' | 'reverse-alphabetical') => {
      const sorted = [...conversations].sort((a, b) => {
        if (order === 'newest') return new Date(b.time).getTime() - new Date(a.time).getTime();
        if (order === 'oldest') return new Date(a.time).getTime() - new Date(b.time).getTime();
        if (order === 'alphabetical') return a.title.localeCompare(b.title);
        if (order === 'reverse-alphabetical') return b.title.localeCompare(a.title);
        return 0;
      });
      setConversations(sorted);
  };

  const handleDelete = (index: number) => {
    const updatedConversations = [...conversations];
    updatedConversations.splice(index, 1);
    setConversations(updatedConversations);
  };

  const { promptConfig, setPromptConfig } = usePrompt();

  useEffect(() => {
      if (myConversations.length) {
          const updatedConversations = myConversations.map(convo => ({
              conversation_id: convo.conversation_id,
              title: convo.modLastUsed.xTitle,
              xIcon: convo.modLastUsed.xIcon,
              iconColor: convo.modLastUsed.iconColor,
              time: convo.time,
              xLoader: convo.modLastUsed.xLoader,
              xPrompt: convo.modLastUsed.xPrompt,
              xTitle: convo.modLastUsed.xTitle,
          }));
          setConversations(updatedConversations);
      }
  }, [myConversations]);


  useEffect(() => {
      setMessagesData({ messages, loading: messagesByConvoLoading, error: messagesByConvoError });
      if (messages && messages.length > 0) {
          Cookies.set('openconversation', JSON.stringify(messages));
      }
  }, [selectedConversationId, messages, messagesByConvoLoading, messagesByConvoError]);

  useEffect(() => {
    if (selectedConversationId && messages && messages.length > 0) {
      Cookies.set('openconversation', JSON.stringify(messages));
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
    }
  }, [selectedConversationId, messages]);

  const isConvoVisible = promptConfig?.showConversationComponent;

  if (!isConvoVisible) {
      return null;
  }

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
        <Box style={{ backgroundColor: rgbaIconColor, padding: '1%', borderRadius: '7px', height:'40px', width:'40px' }}>
          <XIcon size={32} color={color} style={{transform:'translate(2px, 2px)'}}/>
        </Box>
      ) : (
          <div>Icon: {name} not found</div>
      )
    );
  };

  const handleConversationClick = async (conversation_id: string) => {
    const clickedConversation = conversations.find(convo => convo.conversation_id === conversation_id);
    await setSelectedConversationId(conversation_id);
    if (messages && messages.length > 0) {
      Cookies.set('openconversation', JSON.stringify(messages));
    }

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

    if (clickedConversation) {
      setPromptConfig({
        ...promptConfig,
        backendMods : {
          ...promptConfig?.backendMods,
          xIcon: clickedConversation.xIcon,
          iconColor: clickedConversation.iconColor,
          xTitle: clickedConversation.title,
          xPrompt: clickedConversation.xPrompt
        }
      });
    }
  };

  const formatDate = (isoDate: string) => {
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
  };

  return (
    <div style={{ padding: '10px', height: '97.5vh', marginTop:'12px' }}>
    <Select
      data={[
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'alphabetical', label: 'Character A-Z' },
        { value: 'reverse-alphabetical', label: 'Character Z-A' }
      ]}
      value={sortOrder}
      onChange={(value: 'oldest' | 'newest' | 'alphabetical' | 'reverse-alphabetical') => {
        setSortOrder(value);
        sortConversations(value);
      }}
      placeholder="Sort by"
    />
        <ScrollArea
          type="never"
          style={{
            marginTop: '20px',
            height: scrollAreaHeight,
            width: '100%',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
      {conversations.map((conversation, index) => (
        <Paper
          key={index}
          onClick={() => handleConversationClick(conversation.conversation_id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            padding: '10px',
            cursor: 'pointer'
          }}
        >
           <Flex>
             <Flex direction="column" style={{marginLeft:'7px'}}>
                 {renderIcon(conversation.xIcon || '', conversation.iconColor)}
             </Flex>
             <Flex direction="column">
              <Text style={{marginLeft:'6px'}}>{conversation.title}</Text>
              <Text size="xs" style={{marginLeft:'6px'}}>{formatDate(conversation.time)}</Text>
             </Flex>
            </Flex>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="transparent" color="dark"><IconDots size={24}/></ActionIcon>
              </Menu.Target>
            <Menu.Dropdown>
            <Menu.Label>Actions</Menu.Label>
                  <Menu.Item
                    color="red"
                    icon={<IconTrash size={14}/>}
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </Menu.Item>
                  <Menu.Item
                    color="gray"
                    icon={<IconSend size={14}/>}
                  >
                    Share
                  </Menu.Item>
            </Menu.Dropdown>
            </Menu>
          </Paper>
        ))}
      </ScrollArea>
    </div>
  );
};

export default ConversationComponent;
