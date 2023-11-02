import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const client = createClient(supabaseUrl, supabaseAnonKey);

export const fetchGameState = async (conversationId: string | null) => {
    let gameState = null;
    let loading = true;
    let fetchError: Error | null = null;

    try {
        const { data, error } = await client
            .from('user_conversation_ids')
            .select('gameplayState')
            .eq('conversation_id', conversationId);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            gameState = data[0].gameplayState;
        } else {
            console.error("No data found for this conversation ID.");
        }

    } catch (err) {
        console.error("Error fetching game state:", err);
        if (err instanceof Error) {
            fetchError = err;
        } else {
            fetchError = new Error(String(err));
        }
    } finally {
        loading = false;
    }

    return {
        loading,
        gameState,
        fetchError
    };
};
