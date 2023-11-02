import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface ChatMessage {
  owner: string;
  conversation_id: string;
  content: string;
  sender: string;
  token_count: number;
  heading: string | null;
  id: number;
  modUsed: any;
  time: string;
}

export const useGetMessagesByConvoId = (conversationId: any) => {
  const supabaseClient = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error: supabaseError } = await supabaseClient
          .from('user_conversations')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('time', { ascending: true });

        if (supabaseError) {
          console.error('Error from Supabase:', supabaseError); // Logging the error from Supabase
          throw new Error(supabaseError.message);
        }

        setMessages(data);
      } catch (err) {
          if (err instanceof Error) {
              console.error('Caught error:', err); // Logging the caught error
              setError(err);
          } else {
              console.error('Caught exception:', err); // Logging other exceptions
              setError(new Error(String(err)));
          }
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, supabaseClient]);

  return { messages, loading, error };
};
