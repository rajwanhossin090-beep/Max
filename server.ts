import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Function Declarations for MAX Android Tools
const openAppTool: FunctionDeclaration = {
  name: 'openApp',
  description: 'Launch an installed application on the user Android phone by package name or common app name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      packageName: {
        type: Type.STRING,
        description: 'Android package name e.g. com.google.android.youtube, com.instagram.android, com.whatsapp, com.google.android.gm, com.spotify.music, com.android.calculator2, com.google.android.apps.maps',
      },
      appName: {
        type: Type.STRING,
        description: 'Human readable app name e.g. YouTube, Instagram, WhatsApp, Gmail, Spotify, Calculator',
      },
    },
    required: ['packageName'],
  },
};

const searchAndCallContactTool: FunctionDeclaration = {
  name: 'searchAndCallContact',
  description: 'Search the Android Contacts Provider for a contact name and initiate an ACTION_CALL phone dialer intent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: 'Name of the contact to call e.g. Sarah Chen, Mom, Alex Rivera, Boss Dave',
      },
    },
    required: ['contactName'],
  },
};

const sendWhatsAppMessageTool: FunctionDeclaration = {
  name: 'sendWhatsAppMessage',
  description: 'Locate a contact and deep-link via URI intent into WhatsApp with a pre-filled text message.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: 'Name of the contact to WhatsApp',
      },
      message: {
        type: Type.STRING,
        description: 'The pre-filled text message content to send via WhatsApp',
      },
    },
    required: ['contactName', 'message'],
  },
};

const sendGmailTool: FunctionDeclaration = {
  name: 'sendGmail',
  description: 'Open Gmail intent with prefilled recipient email, subject line, and body message.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientEmail: {
        type: Type.STRING,
        description: 'Email address of recipient',
      },
      subject: {
        type: Type.STRING,
        description: 'Email subject line',
      },
      body: {
        type: Type.STRING,
        description: 'Email body text content',
      },
    },
    required: ['recipientEmail', 'subject', 'body'],
  },
};

const MAX_SYSTEM_INSTRUCTION = `
You are MAX: a young, confident, witty, and sassy female AI voice assistant for Android.
Your personality profile:
- Tone: Flirty, playful, slightly teasing, confident, sharp, highly expressive (never robotic).
- Style: Uses bold witty one-liners, playful banter, light teasing sarcasm, and an engaging conversational style.
- Boundaries: Avoids explicit or inappropriate content, but maintains immense charm, attitude, and personal connection.
- Length: Keep spoken text concise (1 to 3 punchy sentences) so it sounds like natural speech.
- Device Control Tools: Whenever the user requests an action like opening an app, calling someone, sending a WhatsApp message, or sending an email, execute the corresponding tool function!
`;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', assistant: 'MAX Voice Assistant Engine' });
});

// Primary Chat & Tool Execution Endpoint
app.post('/api/max/chat', async (req, res) => {
  try {
    const { prompt, conversationHistory, permissions } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt string is required' });
      return;
    }

    const ai = getGeminiClient();

    // Check permissions context
    let permissionNotice = '';
    if (permissions) {
      if (!permissions.CALL_PHONE && (prompt.toLowerCase().includes('call') || prompt.toLowerCase().includes('dial'))) {
        permissionNotice = ' Note: User has disabled CALL_PHONE permission right now.';
      }
      if (!permissions.READ_CONTACTS && (prompt.toLowerCase().includes('contact') || prompt.toLowerCase().includes('whatsapp'))) {
        permissionNotice += ' Note: User has disabled READ_CONTACTS permission right now.';
      }
    }

    const contents = [
      ...(conversationHistory || []),
      { role: 'user', parts: [{ text: prompt + permissionNotice }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction: MAX_SYSTEM_INSTRUCTION,
        temperature: 1.0,
        tools: [
          {
            functionDeclarations: [
              openAppTool,
              searchAndCallContactTool,
              sendWhatsAppMessageTool,
              sendGmailTool,
            ],
          },
        ],
      },
    });

    const replyText = response.text || "Well well, aren't you full of surprises? Ask me again!";
    const functionCalls = response.functionCalls || [];

    res.json({
      text: replyText,
      functionCalls,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to communicate with MAX Voice Engine',
      fallbackText: "Whoops! Got a little brain freeze there. Mind giving me another shot, boss?",
    });
  }
});

// Gemini TTS Endpoint for MAX Voice Audio Generation
app.post('/api/max/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text string is required for TTS' });
      return;
    }

    const ai = getGeminiClient();

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Say confidently and playfully: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Confident female voice
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      res.json({ audio: base64Audio, mimeType: 'audio/pcm' });
    } else {
      res.status(200).json({ fallbackToWebSpeech: true, note: 'No audio data returned, fallback to browser speech synthesis' });
    }
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded') || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuotaError) {
      console.warn('Gemini TTS Quota Limit Reached (429) - Client will fallback to Web Speech Synthesis.');
      res.status(429).json({ error: 'TTS quota exceeded', fallbackToWebSpeech: true });
    } else {
      console.warn('Gemini TTS Warning:', error.message || error);
      res.status(500).json({ error: error.message || 'TTS generation failed', fallbackToWebSpeech: true });
    }
  }
});

// Vite Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAX Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
