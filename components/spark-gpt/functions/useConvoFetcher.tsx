import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

interface ModLastUsedProps {
  xTitle: string;
  xIcon: string;
  iconColor: string;
  xPrompt: string;
  xLoader?: string;
}

interface Conversation {
  conversation_id: string;
  modLastUsed: ModLastUsedProps;
  time: string;
}

export const useConvoFetcher = () => {
  const [myConversations, setMyConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<null | string>(null);

  const user = useUser();
  const userId = user?.id;
  const superbaseClient = useSupabaseClient();

  useEffect(() => {
    const fetchConversations = async () => {
      if (userId) {
        setLoading(true);
        const { data, error } = await superbaseClient
          .from('user_conversation_ids')
          .select('conversation_id, modLastUsed, time')
          .eq('user_id', userId);


          if (error) {
            console.error("Error fetching conversations:", error);
              console.error("Error fetching conversations:", error.message);
              setError(error.message);
          } else if (data) {
              setMyConversations(data);
          } else {
              console.warn("Received no data when fetching conversations.");
              setError("No conversations found.");
          }
        setLoading(false);
      }
    }

    fetchConversations();
  }, [userId, superbaseClient]);

  return { myConversations, loading, error };
}
