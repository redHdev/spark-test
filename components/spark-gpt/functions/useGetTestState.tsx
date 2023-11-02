import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const client = createClient(supabaseUrl, supabaseAnonKey);

type TestResult = {
    companion_id: string;
    user_id: string;
    test_state: any;
};

export const fetchTestState = async (companionId: string | null, userId: string | null) => {
    let testState = null;
    let loading = true;
    let fetchError: Error | null = null;

    try {
        const { data, error } = await client
            .from('test_results')
            .select('test_state')
            .eq('companion_id', companionId)
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        if (data && data.length > 0) {
            testState = data[0].test_state;
        } else {
            console.error("No data found for this companion ID and user ID. Creating a new row...");
            const insertResponse = await client
                .from('test_results')
                .insert([
                    { companion_id: companionId, user_id: userId, test_state: {} }
                ]);

            const insertData: TestResult[] = insertResponse.data ? [insertResponse.data] : [];
            const insertError = insertResponse.error ? new Error(insertResponse.error.message) : null;

            if (insertError) {
                throw insertError;
            }
            if (insertData.length > 0) {
                testState = insertData[0].test_state;
            }
        }

    } catch (err) {
        console.error("Error fetching test state:", err);
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
        testState,
        fetchError
    };
};
