// pages/api/uploadMod.tsx
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Assuming the id of the record to be updated is in the request body
    const { id, newMods } = req.body;

    const { data: existingRecord, error: fetchError } = await supabase
      .from('library')
      .select('SGPT')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching data: ', fetchError);
      res.status(500).json({ error: 'An error occurred while fetching data' });
      return;
    }

    const mergedMods = {
      ...existingRecord.SGPT,
      ...newMods,
    };

    const { error: updateError } = await supabase
      .from('library')
      .update({ SGPT: mergedMods })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating data: ', updateError);
      res.status(500).json({ error: 'An error occurred while updating data' });
      return;
    }

    res.status(200).json({ message: 'Data updated successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
