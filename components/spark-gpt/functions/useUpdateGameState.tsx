import { useState, useEffect, useCallback } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Cookies from 'js-cookie';

export const useUpdateGameState = () => {
  const [upLoading, setLoading] = useState(false);
  const client = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;
  const [upError, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const id = path.split('/chat/')[1];
      setConversationId(id);
    }
  }, []);

  const updateGameState = useCallback(async (gameState: any, conversationId: string | null) => {
    if (!conversationId) {
      console.error("Conversation ID is missing");
      return;
    } else {
    console.log("Updated game state:", gameState);
    }
    setLoading(true);
    try {
      const { data, error } = await client
        .from('user_conversation_ids')
        .update({ gameplayState: gameState })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      if (error) {
        throw error;
      }
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  }, [client, conversationId, userId]);

  useEffect(() => {
    const handleCookieChange = () => {
      const gameStateCookie = Cookies.get('gameState');
      if (gameStateCookie && conversationId) { // Check if conversationId is not null
        const gameStateData = JSON.parse(gameStateCookie);
        updateGameState(gameStateData, conversationId);
      }
    };

    window.addEventListener('storage', handleCookieChange);

    return () => {
      window.removeEventListener('storage', handleCookieChange);
    };
  }, [updateGameState, conversationId]);

  return {
    upLoading,
    upError,
    updateGameState
  };
};
