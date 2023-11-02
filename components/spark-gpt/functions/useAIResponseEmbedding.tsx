import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import GPT3Tokenizer from 'gpt3-tokenizer';
import Cookies from 'js-cookie';

export const useAIResponseEmbedding = () => {
  const user = useUser();
  const client = useSupabaseClient();

  const getConversationIdFromURL = (): string => {
    const path = window.location.pathname.split('/');
    const conversationId = path[path.length - 1];
    if (!conversationId) {
        throw new Error('Conversation ID is missing from the URL.');
    }
    return conversationId;
  };

  const generateEmbeddingForMessage = async (message: string): Promise<number[]> => {
      const response = await fetch('/api/generate-embeddings', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
      });

      if (!response.ok) {
          const { error } = await response.json();
          throw new Error(error || 'Failed to generate embedding');
      }

      const { embedding } = await response.json();
      return embedding;
  };

  const getTokenCount = (message: string): number => {
      const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
      const encoded = tokenizer.encode(message);
      return encoded.text.length;
  };

  const insertIntoUserConversations = async (conversationId: string, embedding: number[], message: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User is not authenticated.');
    }

    const tokenCount = getTokenCount(message);
    const finalMessage = `# ${message}`;

          const BackendModCookie = Cookies.get('backendmods');
          let backendModData;
          if (BackendModCookie) {
            backendModData = JSON.parse(BackendModCookie);
          }

    await client.from('user_conversations').insert({
      owner: user.id,
      conversation_id: conversationId,
      embeddings: embedding,
      sender: 'ai',
      content: finalMessage,
      token_count: tokenCount,
      modUsed: backendModData,
    });
  };


  const handleAIResponseEmbedding = async (message: string): Promise<void> => {
    const conversationId = getConversationIdFromURL();
    const embedding = await generateEmbeddingForMessage(message);
    await insertIntoUserConversations(conversationId, embedding, message);
  };

  return { handleAIResponseEmbedding };
};
