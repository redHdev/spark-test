import { NextApiRequest, NextApiResponse } from 'next';

interface QueryData {
    inputs: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const imageBlob = await query({ inputs: prompt });
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(imageBlob);
    } catch (error) {
        console.error('Error generating image:', error);
        return res.status(500).send('Failed to generate image');
    }
}

async function query(data: QueryData) {
    const huggingFace = process.env.HUGGING_FACE_API_KEY;
    const response = await fetch(
        "https://api-inference.huggingface.co/models/prompthero/openjourney-v4",
        {
            headers: { Authorization: `Bearer ${huggingFace}` },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const responseText = await response.text();
    console.log(responseText);
    const result = await response.blob();
    return result;
}
