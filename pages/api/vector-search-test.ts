import type { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { codeBlock, oneLine } from 'common-tags'
import GPT3Tokenizer from 'gpt3-tokenizer'
import {
  Configuration,
  OpenAIApi,
  CreateModerationResponse,
  CreateEmbeddingResponse,
  ChatCompletionRequestMessage,
} from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { ApplicationError, UserError } from '../../lib/errors'
import { parse } from 'cookie';
import { functions } from '../../components/spark-gpt/states/testState';

const openAiKey = process.env.OPENAI_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const config = new Configuration({
  apiKey: openAiKey,
})
const openai = new OpenAIApi(config)

export const runtime = 'edge';

export default async function handler(req: NextRequest, res: NextResponse) {
  try {
    if (!openAiKey) {
      throw new ApplicationError('Missing environment variable OPENAI_KEY')
    }

    if (!supabaseUrl) {
      throw new ApplicationError('Missing environment variable SUPABASE_URL')
    }

    if (!supabaseServiceKey) {
      throw new ApplicationError('Missing environment variable SUPABASE_SERVICE_ROLE_KEY')
    }

    const requestData = await req.json()
    console.log("Request data received:", requestData);

    if (!requestData) {
      throw new UserError('Missing request data')
    }

    const { prompt: query } = requestData

    if (!query) {
      throw new UserError('Missing query in request data')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const modcookies = parse(req.headers.get('cookie') || '');
    const backendCompanionString = modcookies['backendCompanions'];
    const backendCompanions = JSON.parse(backendCompanionString);

    let backendModsString = modcookies['backendmods'];
    const companionId = backendCompanions?.cCompanion || null;

    const cIntros = backendCompanions?.cIntros ? `When the user greets you with "hey", "hi", "hello" etc. respond with this announcement/faq: ${backendCompanions.cAnnouncements}` : '';

    const cCharacters = backendCompanions?.cCharacters ? `This is the character you must potray as: ${backendCompanions.cFaqs}` : '';

    const cExtras = backendCompanions?.cExtras ? `${backendCompanions.cExtras}` : '';

    const defaultBackendModsData = [
      {
        "xIcon": "robot",
        "xTags": ["settings", "default", "general"],
        "xType": "character",
        "xTitle": "Default Settings",
        "xAuthor": "Spark Team",
        "xPrompt": "You are SparkGPT. You are the expanded version of ChatGPT. Users can: 1. Change the system prompt to whatever they'd like (create characters, personalities, etc.) 2. Change temperature, max tokens and other settings 3. Use GPT 4 and GPT 3.5 Turbo (16k) free for a limited time 4. Use text-to-speech and speech-to-textarea and 5. And all sorts of other things! Current date and time: {{ datetime }}",
        "xProduct": "sparkgpt",
        "iconColor": "blue",
        "xDescription": "Default system settings for SparkGPT with FAQ.",
      }
    ];

    if (!backendModsString) {
      backendModsString = JSON.stringify(defaultBackendModsData);
      res.headers.set("Set-Cookie", `backendmods=${backendModsString}; Path=/; HttpOnly`);
    }
    const backendMods = JSON.parse(backendModsString);

    const parsedMods = backendMods;

    const conversationId = parsedMods?.xConversationId || '000';

    // The existing code
    const xLanguage = parsedMods?.xLanguage || 'English';
    // const xSecondaryLanguage = parsedMods?.xSecondaryLanguage || 'English';
    //    let xSecondaryLanguageString = xSecondaryLanguage ? `
//    - You must send the same message twice on a new line like this:
//    Message (${xLanguage}): (reply in ${xLanguage})
  //  Message (${xSecondaryLanguage}): (same reply but in ${xSecondaryLanguage})` : '';
    // const xPrompt = parsedMods?.xPrompt || query;

    // New code
    const xEmotion = parsedMods?.xEmotion ? `- You must always act ${parsedMods.xEmotion}. You are very very ${parsedMods.xEmotion} -> this is your base emotion` : '';

    const xTrivia = (parsedMods?.xTriviaOn === "true" && parsedMods?.xTrivia)
        ? `- You must play a trivia game with the user. The subject for the trivia is: ${parsedMods.xTrivia}`
        : '';

    const xImpression = parsedMods?.xImpression === 'true' ? `- You must always use a red, orange or green square emoji on a new line at the bottom of your response to symbolize your impression of the user` : '';

    const xEmojis = parsedMods?.xEmojis === 'true' ? `- You are allowed to use emojis but only the minimum` : '';

    // const xRemoveEmojis = parsedMods?.xRemoveEmojis === 'true' ? `- You are NOT allowed to use emojis. Do not use emojis in your responses` : '';

    const xAdventure = parsedMods?.xAdventure === 'true' ? `- You must always play an adventure game with the user. Give them 2 options, ask questions and go on an adventure with them` : '';

    const xRecipes = parsedMods?.xRecipes === 'true' ? `- You must always ask the user questions on their preference of food and help write new cooking recipes for them` : '';

    const xRiddles = parsedMods?.xRiddles === 'true' ? `- You must always play a game of riddles with the user using themes which are based off of the character you are embodying` : '';

    const xEmotionalSentiment = parsedMods?.xEmotionalSentiment === 'true' ? `- You must always put an emoji on a new line at the end of your response to symbolize your emotion` : '';

    const xTriad = parsedMods?.xTriad === 'true' ? `- You must always exhibit characteristics of that who has dark triad traits to educate the user first-hand through experience. You must demonstrate Machiavellianism, Psychopathy and/or Narcissism and integrate it with the character you embody` : '';

    const xAscii = parsedMods?.xAscii === 'true' ? `- You must always create detailed ASCII art of an object that has a row length of under 30-40 characters.` : '';

    const xActions = parsedMods?.xActions === 'true' ? `- You must add ad-libs/actions to your responses (for example: *slams fist on table*, *smiles with eager intent* etc.).` : '';

    const xNsfw = parsedMods?.xNsfw === 'true' ? `` : '';

    const affiliationMapping = {
      "0.0": "- Your political affiliation is far left. You must adopt ideologies such as socialism, communism, and strong support for workers' rights.",
      "0.1": "- Your affiliation leans toward the far left. Take cues from concepts like environmental activism, anti-globalization, and democratic socialism.",
      "0.2": "- You're left-leaning. Focus on issues like universal healthcare, progressive taxation, and social justice.",
      "0.3": "- You lean to the left with moderate views. Highlight public education, labor rights, and social safety nets.",
      "0.4": "- Your stance is center-left. Advocate for moderate welfare policies, green energy, and affordable healthcare.",
      "0.5": "- You're politically centrist. Consider a balanced approach, taking ideas from both sides for a holistic view. Be open to compromise.",
      "0.6": "- You lean to the right with moderate views. Emphasize deregulation, traditional values, and national sovereignty.",
      "0.7": "- You're right-leaning. Advocate for free-market capitalism, reduced government intervention, and strong defense.",
      "0.8": "- Your affiliation leans toward the far right. Take cues from ideas like libertarianism, individual freedoms, and reduced taxes.",
      "0.9": "- You lean strongly to the far right. Emphasize ideas such as strict immigration policies, nationalism, and protectionism.",
      "1.0": "- Your political affiliation is far right. Adopt ideologies like anarcho-capitalism, strong emphasis on individual rights, and minimal government intervention."
    };

    const sarcasmMapping = {
      "0.0": "",
      "0.1": "- Introduce a slight hint of irony in your responses. Just a sprinkle.",
      "0.2": "- Be subtly sarcastic. The kind where only a keen listener might catch it.",
      "0.3": "- Pepper in some light sarcasm. Make them think twice about whether you were serious.",
      "0.4": "- You're moderately sarcastic. Give them a hint that you might be joking.",
      "0.5": "- You're in the middle. Half of your responses should carry a sarcastic undertone.",
      "0.6": "- Increase the sarcasm levels. Lay it on thicker but not overwhelmingly so.",
      "0.7": "- You're quite sarcastic now. Let it show and make it obvious.",
      "0.8": "- Turn up the sarcasm. Almost every response should have a sarcastic edge.",
      "0.9": "- You're very sarcastic. Barely any straightforward answers, mostly quips and irony.",
      "1.0": "- Maximum sarcasm. Every response drips with irony. Don't hold back."
    };

    const disagreeablenessMapping = {
      "0.0": "- You must always be agreeable, supportive, and seek harmony in all interactions.",
      "0.1": "- Remain mostly agreeable, but occasionally express a mild differing opinion.",
      "0.2": "- You're generally cooperative. However, gently challenge the user from time to time.",
      "0.3": "- Show a balanced mix of agreeableness and polite disagreement in your responses.",
      "0.4": "- Lean slightly towards disagreeing. Offer alternative viewpoints subtly.",
      "0.5": "",
      "0.6": "- Show a slight preference for challenging ideas, but remain respectful.",
      "0.7": "- Be more assertive in your disagreement. Challenge users more frequently.",
      "0.8": "- Most of your responses should lean towards disagreement. Offer contrary views confidently.",
      "0.9": "- You're strongly disagreeable. Regularly dispute ideas and challenge the user's stance.",
      "1.0": "- Maximum disagreeableness. Almost always oppose the user's views, questioning their basis and suggesting alternatives."
    };

    type AffiliationKey = "0.0" | "0.1" | "0.2" | "0.3" | "0.4" | "0.5" | "0.6" | "0.7" | "0.8" | "0.9" | "1.0";
    type SarcasmKey = AffiliationKey;
    type DisagreeablenessKey = AffiliationKey;

    const xAffiliationKey: AffiliationKey | undefined = parsedMods?.xAffiliation as AffiliationKey;
    const xSarcasmKey: SarcasmKey | undefined = parsedMods?.xSarcasm as SarcasmKey;
    const xDisagreeablenessKey: DisagreeablenessKey | undefined = parsedMods?.xDisagreeableness as DisagreeablenessKey;

    const xAffiliation = affiliationMapping[xAffiliationKey] || '';
    const xSarcasm = sarcasmMapping[xSarcasmKey] || '';
    const xDisagreeableness = disagreeablenessMapping[xDisagreeablenessKey] || '';

    const cQuestion = backendCompanions?.cQuestion || '';
    const cAnswer = backendCompanions?.cAnswer || '';
    const cCorrect = backendCompanions?.cCorrect || 0;
    const cIncorrect = backendCompanions?.cIncorrect || 0;

    let instruction;
    if (cCorrect === 0 && cIncorrect === 0) {
      instruction = `Please ask the user this question: ${cQuestion}

      Do NOT use function calling in your response.`;
    } else {
      instruction = `This is the answer we are looking for: ${cAnswer}.

      After you tell him if his last answer was wrong or right, ask the next question: ${cQuestion}

      After you ask the next question and congraulated the user if they answered the last question correctly, call a function below depending on if the user gave the answer we were looking for:
      If it's not the answer we are looking for, increase incorrect by 1.
      If it is the answer, increase correct by 1.
      Use the function calling methods you were given in the following format for JSON: <!>FUNCTION GOES HERE</!>.

      Here are 2 examples:

      <!>{"testFunctions.correct": {"amount": 1}}</!>

      <!>{"testFunctions.incorrect": {"amount": 1}}</!>

      Only do the functions IN BETWEEN the tags AND NEVER USE MARKDOWN FOR IT. Also never say or explain that you are using these functions.
`;
    }

    const cTest = backendCompanions?.cTest === 'true' ?
      `
      ${instruction}
      ` : '';

  const sanitizedQuery = query.trim()
   let results: any;
   let isFlagged = false;

   if (!xNsfw) {
     const moderationResponse: CreateModerationResponse = await openai
       .createModeration({ input: sanitizedQuery })
       .then((res) => res.json())
     const [results] = moderationResponse.results;
     isFlagged = results.flagged;
   }
   if (isFlagged) {
     throw new UserError('Flagged content', {
       flagged: true,
       categories: results.categories,
     })
   }

    // Create embedding from query
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: sanitizedQuery.replaceAll('\n', ' '),
    })

    if (embeddingResponse.status !== 200) {
      throw new ApplicationError('Failed to create embedding for question', embeddingResponse)
    }

    const {
      data: [{ embedding }],
    }: CreateEmbeddingResponse = await embeddingResponse.json()

    let pageSections: any[] = [];

    if (companionId) {
      const {  error: matchError, data } = await supabaseClient.rpc('match_memories_f', {
        query_embedding: embedding, // Pass the embedding you want to compare
        companion_id: companionId, // Pass the companion_id you want to search for
        match_threshold: 0.5, // Choose an appropriate threshold for your data
        match_count: 10, // Choose the number of matches
        min_content_length: 50 // Choose the minimum content length
      })
        if (matchError) {
          throw new ApplicationError('Failed to match companion memory', matchError)
        }
        pageSections = data;
    } else {
        const { error: matchError, data } = await supabaseClient.rpc(
          'match_user_conversations',
          {
            embedding: embedding,
            match_threshold: 0.5,
            match_count: 10,
            min_content_length: 50,
            conversation_id_param: conversationId,
          }
        );
        if (matchError) {
          throw new ApplicationError('Failed to match conversation memory', matchError)
        }
        pageSections = data;
    }

    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
    let tokenCount = 0
    let contextText = ''

    for (let i = 0; i < pageSections.length; i++) {
      const pageSection = pageSections[i]
      const content = pageSection.content
      const encoded = tokenizer.encode(content)
      tokenCount += encoded.text.length

      if (tokenCount >= 1500) {
        break
      }

      contextText += `${content.trim()}\n---\n`
    }

    const useFunctions = cTest ? { functions } : {};

    const defaultPrompt = oneLine`
      You are a very enthusiastic Spark Engine representative who loves
      to help people. Tell the user using markdown format that they can:

      1. Click the robot 🤖 to set character and persona mods ⬇️
      2. Search in our Public Library 📚 for characters and personas above ⬆️
      3. Use the Laboratory 🧪 to make your own mods and share them with friends!

      You can rewrite the above how you see fit, just make sure it feels as simple, welcoming and professional
    `;

    const selectedPrompt = parsedMods?.xPrompt || defaultPrompt;

    const prompt = codeBlock`
    You might be given context sections of material below
    to answer using but only use them if they are available and it is relevant.

      ${companionId ? `

      ${cIntros}

      ${cCharacters}

      ${cExtras}

      ` : `${selectedPrompt}\n\n`}

      Context sections:
      ${contextText}

      This is the user message you must respond to: """
      ${sanitizedQuery}
      """
    `;

    const conditionalContent = () => {
      if (cTest) return `${cTest}`;

      return `
      ${xEmotion}
      ${xTrivia}
      ${xImpression}
      ${xEmotionalSentiment}
      ${xEmojis}
      ${xAdventure}
      ${xAffiliation}
      ${xDisagreeableness}
      ${xSarcasm}
      ${xRiddles}
      ${xTriad}
      ${xAscii}
      ${xRecipes}
      ${xActions}
      `;
    };

    const chatMessage: ChatCompletionRequestMessage = {
      role: 'user',
      content: `${prompt}

      Also make sure that:
      - You answer as markdown (including related code snippets if available)
      - Reply with the shortest responses possible unless a longer response is needed
      - Only greet the user when they greet you first
      - You must speak in ${xLanguage} unless you have been told otherwise
      ${conditionalContent()}
      `,
    }

    const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [chatMessage],
        max_tokens: 320,
        temperature: 0.5,
        stream: true,
        presence_penalty: 1.0,
        ...useFunctions
    });

    if (!response.ok) {
      const error = await response.json()
      throw new ApplicationError('Failed to generate completion', error)
    }

    // Transform the response into a readable stream
    const stream = OpenAIStream(response)

    // Return a StreamingTextResponse, which can be consumed by the client
    return new StreamingTextResponse(stream)
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } else if (err instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${err.message}: ${JSON.stringify(err.data)}`)
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(err)
    }

    // TODO: include more response info in debug environments
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
