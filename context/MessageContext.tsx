import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { usePrompt } from './PromptConfig';

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

interface MessagesData {
  messages: ChatMessage[];
  loading: boolean;
  error: any;
}

interface MessageContextProps {
    messagesData: MessagesData;
    setMessagesData: React.Dispatch<React.SetStateAction<MessagesData>>;
}

const MessageContext = createContext<MessageContextProps | undefined>(undefined);

export const useMessages = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error("useMessages must be used within a MessageProvider");
    }
    return context;
};

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messagesData, setMessagesData] = useState<MessagesData>({ messages: [], loading: false, error: null });

    const { promptConfig, setPromptConfig } = usePrompt();

    useEffect(() => {
        console.log(messagesData);
        if (messagesData.messages.length > 0) {
            const conversationId = messagesData.messages[0].conversation_id;
            window.history.pushState({}, '', `${process.env.SITE_URL}/chat/${conversationId}`);
        }
        const lastMessage = messagesData.messages[messagesData.messages.length - 1];
        if (lastMessage && lastMessage.modUsed && Array.isArray(lastMessage.modUsed) && lastMessage.modUsed.length > 0) {
            console.log(promptConfig, "lastMessage.modUsed");
            const modsToUpdate = lastMessage.modUsed.reduce((acc, key) => {
              acc[key] = true;
              return acc;
            }, {});

            setPromptConfig({
              ...promptConfig,
              backendMods: {
                ...promptConfig?.backendMods,
                ...modsToUpdate
              }
            });
        }
    }, [messagesData]);

    return (
        <MessageContext.Provider value={{ messagesData, setMessagesData }}>
            {children}
        </MessageContext.Provider>
    );
};
