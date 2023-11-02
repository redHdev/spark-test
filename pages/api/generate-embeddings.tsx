// pages/api/embeddings.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY });
        const openAi = new OpenAIApi(configuration);
        const input = message.replace(/\n/g, ' ');

        const embeddingResponse = await openAi.createEmbedding({
            model: 'text-embedding-ada-002',
            input: input,
        });
        const [{ embedding }] = embeddingResponse.data.data;

        res.status(200).json({ embedding });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to generate embedding' });
    }
}
