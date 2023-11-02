import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { usePrompt } from '../../../context/PromptConfig';

export const useUpdateModLastUsed = () => {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;
  const {promptConfig} = usePrompt();

  const updateModLastUsed = async () => {
    const uuidFromUrl = window.location.pathname.split('/chat/')[1];

    const modLastUsed = promptConfig?.backendMods || {};
    try {
        let updateQuery = supabaseClient
            .from('user_conversation_ids')
            .update({ modLastUsed: modLastUsed })
            .eq('conversation_id', uuidFromUrl);

        if (userId) {
            updateQuery = updateQuery.eq('user_id', userId);
        }

        const { error } = await updateQuery;

        if (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error updating modLastUsed:', error);
    }
  };

  return updateModLastUsed;
};
