import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const openaiEndpoint = 'https://api.openai.com/v1/completions';
const openaiApiKey = process.env.OPENAI_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const body = {
        model: 'gpt-3.5-turbo-instruct',
        prompt: `
        This is my JSON config file.

        {
          "xTitle":"Character Template",
          "xAuthor": "name",
          "xDescription":"A description goes here",
          "xProduct":"sparkgpt",
          "xType":"character",
          "xPrompt":"You are ____. You are currently _____ and must ask the user questions to ____. Say ____ catchphrases and always act _____ like _____ with ____ etc. etc. (you can add anything here).",
          "xIcon":"apple",
          "iconColor":"choose a color",
          "xLoader":"😃😞😱",
          "xTags": ["tag1", "tag2", "tag3"]
        }

      This is what I want: ${prompt}

      You must fill out the json file and provide:
      1. An xDescription under 34 characters
      2. An xTitle under 16 characters
      3: An iconColor that is a vibrant colour hex but not too light or extremely saturated (whatever fits best with the requested character. Do NOT do basic colour hex codes, only ones that are intricate)
      4. A prompt (xPrompt) under 1200 characters for the AI who will be using this config json. Tell the AI what to do/be and how to treat and talk to the user. Be as descriptive as possible and make the prompt have a high success rate of acting exactly like the character/persona and if the character/persona is casual or more entertainment-based (not serious like a scientist, tutor etc.) then tell the AI in the prompt that they can use emojis but the bare minimum
      5. 3 xTags that are 1 word tags which correspond with the genre and topics surrounding the character
      6. leave the xIcon the same
      7. replace the 3 xLoader emojis with 3 object emojis (not face emojis) that represent the character

      Leave all the other settings/parameters as they are and DO NOT RESPOND WITH ANYTHING OTHER THAN THE JSON FILE!
      All keys must also be wrapped in double quotes. For example, this is valid: {"key": "value"}
      `,
        max_tokens: 1500,
        temperature: 0.3
    };

    const headers = {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
    };

    try {
        const openaiResponse = await axios.post(openaiEndpoint, body, { headers });
        const completionText = openaiResponse.data?.choices?.[0]?.text?.trim() || '';
        return res.send(completionText);
    } catch (error) {
        console.error('Error generating GPT response:', error);
        return res.status(500).send('OpenAI API call failed');
    }
}
