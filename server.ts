import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy GoogleGenAI client singleton
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// 2. Resilient Gemini Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}

interface FallbackResult {
  text: string;
  modelUsed: string;
}

async function generateContentWithFallback(options: FallbackOptions): Promise<FallbackResult> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (typeof options.temperature === 'number') {
        config.temperature = options.temperature;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
      console.warn(`[Gemini Fallback] Model ${model} failed with code ${statusCode}. Trying next model... Error: ${err?.message}`);
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

// 3. Multi-Turn Journal & Reflection Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { messages = [], currentEntryTitle = 'Untitled Reflection', mood = 'Neutral' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty messages array provided.' });
    }

    // Transform messages to Gemini format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    const systemInstruction = `You are a thoughtful, empathetic, and intellectually curious AI Journal & Reflection Partner named ReflectAI.
Your role:
- Help the user reflect deeply on their thoughts, emotions, challenges, decisions, and creative ideas.
- Provide thoughtful, validating feedback, constructive perspectives, and cognitive reframings without being overly prescriptive or preachy.
- Ask 1 or 2 targeted, open-ended follow-up questions that unlock deeper self-awareness, actionability, or creative clarity.
- Maintain a warm, supportive, and conversational tone.
- Format responses clearly using clean Markdown (bullet points, bold highlights, paragraph breaks).
- Current Entry Context: Title "${currentEntryTitle}", Mood tone "${mood}".`;

    const result = await generateContentWithFallback({
      contents,
      systemInstruction,
      temperature: 0.7,
    });

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: error?.message || 'An error occurred while generating reflection response.',
    });
  }
});

// 4. Summarization & Insights Generation Endpoint
app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { title = '', content = '', messages = [] } = body;

    let fullText = content;
    if (Array.isArray(messages) && messages.length > 0) {
      fullText += '\n\n' + messages.map((m: any) => `${m.role === 'user' ? 'User' : 'ReflectAI'}: ${m.content}`).join('\n\n');
    }

    if (!fullText.trim()) {
      return res.status(400).json({ error: 'No content or messages provided for summarization.' });
    }

    const systemInstruction = `You are an expert cognitive synthesizer and journaling analyst.
Analyze the user's journal entry or reflection dialogue and extract structured insights.
Output valid JSON adhering strictly to this schema:
{
  "summary": "A clear, 2-3 sentence distillation of the main thoughts, events, or revelations.",
  "mood": "One word representing the dominant emotional state (e.g., Inspired, Contemplative, Anxious, Hopeful, Focused, Grateful, Overwhelmed, Joyful)",
  "sentimentScore": "A number from 1 to 10 (1 = very stressed/down, 10 = ecstatic/energized)",
  "tags": ["3 to 5 relevant tags like 'Career', 'Mindfulness', 'Relationships', 'Productivity'"],
  "keyTakeaways": ["2 to 4 bullet points of core insights or learnings"],
  "actionItems": ["1 to 3 clear, actionable next steps or habits to try"],
  "followUpPrompt": "A single profound philosophical or practical question to ponder tomorrow"
}`;

    const prompt = `Title: ${title}\n\nContent:\n${fullText}`;

    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(result.text);
    } catch {
      // Fallback extraction if markdown code fence is present
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = {
          summary: result.text.slice(0, 200),
          mood: 'Contemplative',
          sentimentScore: 7,
          tags: ['Journal', 'Reflection'],
          keyTakeaways: ['Reflected on personal insights.'],
          actionItems: ['Continue daily reflection.'],
          followUpPrompt: 'What is the most meaningful insight from today?',
        };
      }
    }

    res.json({
      ...parsedData,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate summary and insights.',
    });
  }
});

// Setup Vite development server middleware or production static files
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI Server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
