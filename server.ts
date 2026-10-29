import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Shared Gemini Client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ----------------------------------------------------
// 1. Google Maps Grounding with gemini-3.8-flash
// ----------------------------------------------------
app.post('/api/gemini/maps-grounding', async (req: Request, res: Response) => {
  try {
    const { query, userLocation } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (
      userLocation &&
      typeof userLocation.latitude === 'number' &&
      typeof userLocation.longitude === 'number'
    ) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config,
    });

    const text = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract all Google Maps URLs and place snippets
    const mapsLinks: Array<{
      title: string;
      uri: string;
      address?: string;
      rating?: number;
      reviewSnippets?: string[];
    }> = [];

    for (const chunk of chunks) {
      if ((chunk as any).maps) {
        const m = (chunk as any).maps;
        mapsLinks.push({
          title: m.title || 'شوێن لەسەر Google Maps',
          uri: m.uri || '',
          address: m.address || '',
          rating: m.rating,
          reviewSnippets: m.placeAnswerSources?.reviewSnippets || [],
        });
      }
    }

    return res.json({
      text,
      mapsLinks,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata,
    });
  } catch (error: any) {
    console.error('Maps Grounding Error:', error);
    return res.status(500).json({
      error: error.message || 'هەڵە لە وەرگرتنی داتای Google Maps',
    });
  }
});

// ----------------------------------------------------
// 2. Intelligent Assistant Chat with gemini-3.8-flash
// ----------------------------------------------------
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'me' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction:
          'تۆ یاریدەدەری زیرەکی زانکۆ بازاری (Zanko Bazaar)، پلاتفۆرمی کڕین و فرۆشتنی زانکۆکانی هەرێمی کوردستان. یارمەتی قوتابیان و مامۆستایان بدە لە دۆزینەوەی کتێب، لاپتۆپ، کەرەستەی خوێندن، ئامۆژگاری نرخی گونجاو، و شوێنی سەلامەتی چاوپێکەوتن لە کەمپەسەکان. بە کوردییەکی ڕەوان و هاوڕێیانە وەڵام بدەرەوە.',
      },
    });

    return res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    return res.status(500).json({
      error: error.message || 'هەڵە لە پەیوەندی بە ژیری دەستکرد',
    });
  }
});

// ----------------------------------------------------
// Create HTTP & WebSocket Server
// ----------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Route upgrade for Live Voice API WebSocket (/api/live-voice)
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url?.split('?')[0];
  if (pathname === '/api/live-voice' || pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// ----------------------------------------------------
// 3. Gemini Live API (gemini-3.8-live) Real-Time Voice
// ----------------------------------------------------
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice WebSocket');
  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Puck',
            },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction:
          'You are the friendly, real-time AI Voice Assistant for Zanko Bazaar (زانکۆ بازار), the student marketplace for Kurdistan universities. You speak Kurdish (Sorani & Kurmanji) and English. You help students find textbooks, laptops, electronics, stationery, compare campus prices, and find safe meetup locations near university campuses. Keep responses concise, warm, natural, and helpful.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const content = message.serverContent;
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Stream real-time input transcription (speech-to-text of user)
          if (content?.inputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ inputTranscript: content.inputTranscription.text })
            );
          }

          // Stream real-time output transcription (spoken text of AI)
          if (content?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ outputTranscript: content.outputTranscription.text })
            );
          }

          // Stream 24kHz audio chunks to client
          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }

          // Handle speech interruption
          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }

          if (content?.turnComplete) {
            clientWs.send(JSON.stringify({ turnComplete: true }));
          }
        },
      },
    });

    clientWs.send(
      JSON.stringify({
        status: 'ready',
        message: 'پەیوەندی دەنگی ڕاستەوخۆ چالاک کرا (Gemini Live Ready)',
      })
    );
  } catch (err: any) {
    console.error('Failed to initialize Live API session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          error:
            err.message || 'نەتوانرا پەیوەندی دەنگی ڕاستەوخۆ دەستپێبکرێت',
        })
      );
      clientWs.close();
    }
    return;
  }

  clientWs.on('message', (data) => {
    if (!session) return;
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.audio) {
        // Send 16kHz PCM audio chunk to Live API
        session.sendRealtimeInput({
          audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (parsed.text) {
        session.sendRealtimeInput({
          text: parsed.text,
        });
      }
    } catch (err) {
      console.error('Error sending input to Live session:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from Live Voice WebSocket');
    if (session) {
      try {
        session.close();
      } catch (e) {
        // Handled
      }
    }
  });
});

// ----------------------------------------------------
// Vite Dev Server / Static Production Serving
// ----------------------------------------------------
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
