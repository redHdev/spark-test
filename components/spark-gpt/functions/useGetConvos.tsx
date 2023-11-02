import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface ChatMessage {
  sender: string;
  content: string;
  time: string;
  xIcon: string;
  xTitle: string;
  iconColor: string;
  xLoader?: string;
}

export const useGetConvos = (conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const superbaseClient = useSupabaseClient();

  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationId) {
        setLoading(true);
        const { data, error } = await superbaseClient
          .from('user_conversations')
          .select('sender, content, time, modUsed')
          .eq('conversation_id', conversationId);

          if (error) {
              console.error("Error fetching messages for conversation:", error.message);
              setError(error.message);
          } else if (data) {
              const formattedMessages = data.map((message: any) => {
                  const modData = JSON.parse(message.modUsed);
                  return {
                      content: message.content,
                      sender: message.sender,
                      time: message.time,
                      xIcon: modData.xIcon,
                      xTitle: modData.xTitle,
                      iconColor: modData.iconColor,
                      xLoader: modData.xLoader,
                  };
              });
              setMessages(formattedMessages);
          } else {
              console.warn("Received no data when fetching messages for conversation.");
              setError("No messages found for conversation.");
          }
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, superbaseClient]);

  return { messages, loading, error };
};
