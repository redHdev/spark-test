import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePrompt } from '../../../context/PromptConfig';

type Conversation = {
  id: string;
}

export const useCreateConversation = () => {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const { promptConfig, setPromptConfig } = usePrompt();

  const createConversation = async () => {
    if (!user) return;

    if (window.location.pathname.includes("/chat/")) {
      return;
    }

    const conversationId = uuidv4();

    try {
      const { data, error } = await supabaseClient
        .from('user_conversation_ids')
        .insert({
          user_id: user?.id,
          conversation_id: conversationId
        })
        .single();

      if (error) throw error;

      setConversation(data);
      window.history.pushState({}, "", `/chat/${conversationId}`);

      // Add xConversationId to the backendmods context
      const currentBackendMods = promptConfig?.backendMods || {};

      currentBackendMods.xConversationId = conversationId;
      if(promptConfig){
        setPromptConfig({
          ...promptConfig,
          backendMods : {
            ...promptConfig?.backendMods,
            ...currentBackendMods
          }
        });
      }
      else{
        setPromptConfig({
          backendMods : {
            ...currentBackendMods
          }
        });
      }

    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return { conversation, createConversation };
};
