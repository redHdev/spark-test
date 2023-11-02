import { useState, useCallback } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useCompanion } from '../../../context/MemoriesContext';

export const useUpdateTestState = () => {
  const [upLoading2, setLoading2] = useState(false);
  const client = useSupabaseClient();
  const user = useUser();
  const userId = user?.id;
  const [upError2, setError2] = useState<Error | null>(null);

  const { selectedCompanion } = useCompanion();
  const companionId = selectedCompanion?.companion_id;

  const updateTestState = useCallback(async (testState: any, companionId: string | null) => {
    if (!companionId) {
      console.error("Companion ID is missing");
      return;
    } else {
      console.log("Updated test state:", testState);
    }
    setLoading2(true);
    try {
      const { data, error } = await client
        .from('test_results')
        .update({ test_state: testState })
        .eq('companion_id', companionId)
        .eq('user_id', userId);
      if (error) {
        throw error;
      }
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError2(err);
      } else {
        setError2(new Error(String(err)));
      }
    } finally {
      setLoading2(false);
    }
  }, [client, companionId, userId]);

  return {
    upLoading2,
    upError2,
    updateTestState
  };
};
