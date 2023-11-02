// pages/api/getMods.tsx
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const newData = req.body;
    const { error } = await supabase
      .from('library')
      .insert([{
        SGPT: newData
      }]);

    if (error) {
      console.error('Error: ', error);
      res.status(500).json({ error: 'An error occurred while saving data' });
    } else {
      res.status(200).json({ message: 'Data successfully saved!' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
