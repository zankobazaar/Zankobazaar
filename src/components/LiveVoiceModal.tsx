import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  AlertCircle,
  Loader2,
  PhoneCall,
  PhoneOff,
  CornerDownLeft,
} from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('ئامادەیە بۆ دەستپێکردن');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live subtitles / transcripts
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [transcriptHistory, setTranscriptHistory] = useState<
    Array<{ sender: 'user' | 'ai'; text: string }>
  >([]);

  // WebSocket & Web Audio references
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  // Convert Float32Array to 16-bit PCM Base64
  const float32ToPcmBase64 = (float32Array: Float32Array): string => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    let binary = '';
    const bytes = new Uint8Array(pcm16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Convert Base64 24kHz PCM to AudioBuffer
  const pcmBase64ToAudioBuffer = (
    ctx: AudioContext,
    base64Data: string
  ): AudioBuffer => {
    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
  };

  // Play audio chunk with precise gapless scheduling
  const scheduleAudioChunk = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const buffer = pcmBase64ToAudioBuffer(ctx, base64Audio);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime + 0.05;
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
      setIsAiSpeaking(true);

      source.onended = () => {
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
          setIsAiSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Error scheduling audio chunk:', e);
    }
  };

  const startVoiceSession = async () => {
    setErrorMsg(null);
    setIsConnecting(true);
    setStatusText('پەیوەستبوون بە مۆدێلی Gemini 3.8 Live...');

    try {
      // 1. Initialize 16kHz audio capture for microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      // 2. Initialize 24kHz audio playback for Gemini Live
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextPlayTimeRef.current = outputCtx.currentTime;

      // 3. Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusText('پەیوەستکراوە! دەتوانیت دەست بە قسەکردن بکەیت...');

        // Start processing mic input
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const base64Audio = float32ToPcmBase64(inputData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.error) {
            setErrorMsg(msg.error);
            setStatusText('هەڵە لە پەیوەندی');
            return;
          }

          if (msg.status === 'ready') {
            setStatusText('ئامادەیە بۆ وەرگرتنی دەنگ');
          }

          if (msg.inputTranscript) {
            setUserTranscript((prev) => prev + ' ' + msg.inputTranscript);
          }

          if (msg.outputTranscript) {
            setAiTranscript((prev) => prev + ' ' + msg.outputTranscript);
          }

          if (msg.audio) {
            scheduleAudioChunk(msg.audio);
          }

          if (msg.interrupted) {
            // User interrupted AI speech
            if (outputAudioCtxRef.current) {
              nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setIsAiSpeaking(false);
          }

          if (msg.turnComplete) {
            // Save turn to history
            setUserTranscript((u) => {
              if (u.trim()) {
                setTranscriptHistory((h) => [...h, { sender: 'user', text: u.trim() }]);
              }
              return '';
            });
            setAiTranscript((a) => {
              if (a.trim()) {
                setTranscriptHistory((h) => [...h, { sender: 'ai', text: a.trim() }]);
              }
              return '';
            });
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        setErrorMsg('پەیوەندی بە سێرڤەری دەنگی پچڕا');
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText('پەیوەندی کۆتایی پێهات');
      };
    } catch (err: any) {
      console.error('Mic access or setup error:', err);
      setIsConnecting(false);
      setIsConnected(false);
      setErrorMsg(
        err.message || 'تکایە ڕێگە بە مایکرۆفۆن بدە بۆ بەکارهێنانی گفتوگۆی دەنگی'
      );
      setStatusText('شکستی هێنا لە دەستپێکردن');
    }
  };

  const endVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    setStatusText('پەیوەندی داخرا');
  };

  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      endVoiceSession();
    }
    return () => {
      endVoiceSession();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-600 via-blue-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  گفتوگۆی دەنگی ڕاستەوخۆ
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                  Gemini 3.8 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                قسە لەگەڵ یاریدەدەری زیرەکی زانکۆ بازار بکە بە دەنگی زیندوو
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              endVoiceSession();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Visualizer Area */}
        <div className="py-8 flex flex-col items-center justify-center text-center">
          {/* Animated Central Voice Orb */}
          <div className="relative mb-5 flex items-center justify-center">
            {/* Outer Pulsing Rings */}
            {isConnected && (
              <>
                <div
                  className={`absolute w-36 h-36 rounded-full border border-violet-500/20 animate-ping duration-1000 ${
                    isAiSpeaking ? 'opacity-100' : 'opacity-40'
                  }`}
                />
                <div
                  className={`absolute w-28 h-28 rounded-full bg-gradient-to-tr from-blue-500/10 to-violet-500/20 blur-md ${
                    isAiSpeaking ? 'scale-125' : 'scale-100'
                  } transition-transform duration-300`}
                />
              </>
            )}

            {/* Core Mic / Speaker Circle */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-10 ${
                isConnecting
                  ? 'bg-slate-800 text-slate-400'
                  : isAiSpeaking
                  ? 'bg-gradient-to-tr from-blue-600 to-emerald-500 text-white shadow-emerald-500/30 scale-110'
                  : isConnected
                  ? isMuted
                    ? 'bg-rose-950/80 border border-rose-800 text-rose-400'
                    : 'bg-gradient-to-tr from-violet-600 to-blue-600 text-white shadow-blue-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isConnecting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isAiSpeaking ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : isMuted ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </div>
          </div>

          {/* Status Label */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? isAiSpeaking
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-blue-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-sm font-semibold text-slate-200">
              {statusText}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {isAiSpeaking
              ? 'Gemini وەڵامت دەداتەوە...'
              : isConnected
              ? isMuted
                ? 'مایکرۆفۆن کوژاوەتەوە'
                : 'گوێت لێدەگرێت، بە کوردی یان ئینگلیزی قسە بکە'
              : 'چاوەڕوانی دەستپێکردن...'}
          </p>
        </div>

        {/* Live Subtitles / Conversation Box */}
        <div className="flex-1 min-h-[140px] max-h-[200px] overflow-y-auto bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 mb-4 text-xs font-sans">
          {transcriptHistory.length === 0 && !userTranscript && !aiTranscript && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center gap-1.5 py-4">
              <Radio className="w-5 h-5 text-slate-600" />
              <span>دەنگەکەت ڕاستەوخۆ دەگۆڕێت بۆ دەقی کوردی و وەڵامی دەنگی</span>
            </div>
          )}

          {transcriptHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl ${
                item.sender === 'user'
                  ? 'bg-blue-950/40 border border-blue-900/50 text-blue-200 ms-6 text-end'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-200 me-6 text-start'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 mb-0.5">
                {item.sender === 'user' ? 'تۆ (You)' : 'Gemini 3.8 Live'}
              </div>
              <p className="leading-relaxed">{item.text}</p>
            </div>
          ))}

          {/* Active Streaming Transcripts */}
          {userTranscript && (
            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-300 ms-6 text-end animate-pulse">
              <div className="text-[10px] font-bold text-blue-400 mb-0.5">تۆ (دەنگەکەت)...</div>
              <p>{userTranscript}</p>
            </div>
          )}

          {aiTranscript && (
            <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-800/40 text-violet-200 me-6 text-start animate-pulse">
              <div className="text-[10px] font-bold text-violet-400 mb-0.5">Gemini...</div>
              <p>{aiTranscript}</p>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bottom Voice Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {isConnected && (
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-rose-900/60 text-rose-300 hover:bg-rose-900'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'لابردنی بێدەنگی' : 'بێدەنگکردن (Mute)'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                type="button"
                onClick={endVoiceSession}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>کۆتایی پێهێنان</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceSession}
                disabled={isConnecting}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <PhoneCall className="w-4 h-4" />
                <span>دەستپێکردنەوەی پەیوەندی</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
