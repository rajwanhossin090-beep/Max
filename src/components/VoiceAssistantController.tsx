import React, { useState, useEffect, useRef } from 'react';
import { MaxState, PermissionState, ToolCallPayload, VoiceMessage, Contact, InstalledApp } from '../types';
import { MAX_SASSY_ONELINERS } from '../data/mockData';
import { MaxOrbCanvas } from './MaxOrbCanvas';
import { Mic, MicOff, Volume2, Sparkles, Send, Play, Square, Phone, MessageCircle, Mail, ExternalLink, RefreshCw } from 'lucide-react';

interface VoiceAssistantControllerProps {
  permissions: PermissionState;
  contacts: Contact[];
  apps: InstalledApp[];
  messages: VoiceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<VoiceMessage[]>>;
  activeToolCall: ToolCallPayload | null;
  setActiveToolCall: (tool: ToolCallPayload | null) => void;
  isForegroundServiceActive: boolean;
}

export const VoiceAssistantController: React.FC<VoiceAssistantControllerProps> = ({
  permissions,
  contacts,
  apps,
  messages,
  setMessages,
  activeToolCall,
  setActiveToolCall,
  isForegroundServiceActive,
}) => {
  const [maxState, setMaxState] = useState<MaxState>('idle');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.2);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | HTMLAudioElement | null>(null);

  // Initialize Web Speech Recognition for local wake-word & continuous voice input
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setMaxState('listening');
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        // Interrupt MAX if MAX is currently speaking
        if (maxState === 'speaking') {
          stopAudioPlayback();
          setMaxState('listening');
        }

        // Check for wake word "MAX" or "Hey MAX"
        if (transcript.toLowerCase().includes('max') || transcript.toLowerCase().includes('hey max')) {
          setWakeWordDetected(true);
          setTimeout(() => setWakeWordDetected(false), 3000);
        }

        if (event.results[event.results.length - 1].isFinal) {
          const finalPrompt = transcript.trim();
          if (finalPrompt) {
            handleUserVoiceInput(finalPrompt);
          }
        }
      };

      recognitionRef.current.onerror = (err: any) => {
        console.warn('Speech Recognition Error:', err);
        setIsListening(false);
        if (maxState === 'listening') setMaxState('idle');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (maxState === 'listening') setMaxState('idle');
      };
    }
  }, [maxState]);

  // Audio Level pulse simulation
  useEffect(() => {
    let timer: any;
    if (maxState === 'speaking' || maxState === 'listening') {
      timer = setInterval(() => {
        setAudioLevel(Math.random() * 0.7 + 0.3);
      }, 150);
    } else {
      setAudioLevel(0.2);
    }
    return () => clearInterval(timer);
  }, [maxState]);

  const toggleListening = () => {
    if (!permissions.RECORD_AUDIO) {
      speakSassyResponse("Honey, I can't hear a word you say if you keep microphone permissions disabled! Turn RECORD_AUDIO on first!");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setMaxState('idle');
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Start recognition issue:', e);
      }
    }
  };

  const stopAudioPlayback = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioSourceRef.current) {
      if ('stop' in currentAudioSourceRef.current) {
        try {
          (currentAudioSourceRef.current as AudioBufferSourceNode).stop();
        } catch (e) {}
      } else if ('pause' in currentAudioSourceRef.current) {
        (currentAudioSourceRef.current as HTMLAudioElement).pause();
      }
    }
  };

  const handleUserVoiceInput = async (prompt: string) => {
    stopAudioPlayback();

    const userMsg: VoiceMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setMaxState('thinking');

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/max/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          conversationHistory: history,
          permissions,
        }),
      });

      const data = await res.json();
      const replyText = data.text || "Well aren't you witty? Ask me something else!";
      const functionCalls = data.functionCalls || [];

      let executedToolCall: ToolCallPayload | null = null;

      // Handle function calling / device tools execution
      if (functionCalls.length > 0) {
        const call = functionCalls[0];
        const toolName = call.name;
        const args = call.args || {};

        // Verify permission guardrails before executing
        let hasRequiredPermission = true;
        let permissionErrorMessage = '';

        if (toolName === 'searchAndCallContact') {
          if (!permissions.CALL_PHONE || !permissions.READ_CONTACTS) {
            hasRequiredPermission = false;
            permissionErrorMessage = "Honey, I can't place phone calls if you keep locking me out of Call Phone permissions!";
          }
        } else if (toolName === 'sendWhatsAppMessage') {
          if (!permissions.READ_CONTACTS) {
            hasRequiredPermission = false;
            permissionErrorMessage = "I need Read Contacts permissions to find your friends on WhatsApp, boss!";
          }
        }

        if (hasRequiredPermission) {
          executedToolCall = {
            toolName,
            args,
            timestamp: Date.now(),
            status: 'success',
          };
          setActiveToolCall(executedToolCall);
        } else {
          executedToolCall = {
            toolName,
            args,
            timestamp: Date.now(),
            status: 'permission_denied',
            resultMessage: permissionErrorMessage,
          };
          speakSassyResponse(permissionErrorMessage);
          return;
        }
      }

      const maxMsg: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'max',
        text: replyText,
        timestamp: new Date(),
        toolCall: executedToolCall || undefined,
        sassyEmotion: 'playful',
      };

      setMessages((prev) => [...prev, maxMsg]);

      if (!isMuted) {
        await speakSassyResponse(replyText);
      } else {
        setMaxState('idle');
      }
    } catch (err: any) {
      console.error('Error communicating with MAX server:', err);
      const fallbackMsg = "Whoops! Network hiccup there. Ask me again, handsome!";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'max',
          text: fallbackMsg,
          timestamp: new Date(),
        },
      ]);
      speakSassyResponse(fallbackMsg);
    }
  };

  const speakSassyResponse = async (text: string) => {
    setMaxState('speaking');

    // Attempt Gemini TTS API audio first
    try {
      const ttsRes = await fetch('/api/max/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        if (ttsData.audio) {
          const audio = new Audio(`data:audio/pcm;base64,${ttsData.audio}`);
          currentAudioSourceRef.current = audio;
          audio.play().catch(() => playSpeechSynthesisFallback(text));
          audio.onended = () => setMaxState('idle');
          return;
        }
      } else if (ttsRes.status === 429) {
        console.info('Gemini TTS rate limit hit (429). Falling back to Web Speech Synthesis.');
      }
    } catch (e) {
      console.warn('Gemini TTS endpoint unavailable, using Web Speech Synthesis fallback.');
    }

    // Web Speech Synthesis Fallback with sassy pitch/rate tuning
    playSpeechSynthesisFallback(text);
  };

  const playSpeechSynthesisFallback = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Slightly fast snappy pace
      utterance.pitch = 1.25; // Confident young female pitch

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Zira') ||
          v.name.includes('Female')
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => setMaxState('idle');
      utterance.onerror = () => setMaxState('idle');

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setMaxState('idle'), 3000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleUserVoiceInput(inputText);
  };

  const triggerSampleSassyCommand = (cmd: string) => {
    handleUserVoiceInput(cmd);
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto space-y-6">
      {/* Central MAX Presence Orb Visualizer */}
      <div className="relative flex flex-col items-center justify-center pt-2">
        {wakeWordDetected && (
          <div className="absolute -top-4 bg-gradient-to-r from-pink-500 to-cyan-400 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-pink-500/50 animate-bounce z-20">
            🔥 Wake Word "MAX" Detected!
          </div>
        )}

        <MaxOrbCanvas
          state={maxState}
          audioLevel={audioLevel}
          onClick={toggleListening}
        />

        {/* State Banner & Waveform bars */}
        <div className="mt-2 flex flex-col items-center space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                maxState === 'idle'
                  ? 'bg-cyan-400'
                  : maxState === 'listening'
                  ? 'bg-pink-500 animate-ping'
                  : maxState === 'thinking'
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-emerald-400 animate-bounce'
              }`}
            />
            <p className="text-white font-medium tracking-[0.2em] text-sm">
              {maxState === 'idle' && 'STANDING BY'}
              {maxState === 'listening' && 'LISTENING...'}
              {maxState === 'thinking' && 'PROCESSING LIVE SESSION...'}
              {maxState === 'speaking' && 'MAX SPEAKING'}
            </p>
          </div>

          <p className="text-[#00F0FF] text-xs italic font-serif opacity-80 text-center">
            {maxState === 'idle' && '"Speak up, buttercup. I\'m all ears."'}
            {maxState === 'listening' && '"Go ahead, lay it on me!"'}
            {maxState === 'thinking' && '"Running that through my brilliant AI core..."'}
            {maxState === 'speaking' && '"Pay attention, darling!"'}
          </p>
        </div>
      </div>

      {/* Recent Activity / Last Message Glass Pill */}
      {messages.length > 0 && (
        <div className="w-full px-5 py-2.5 glass-pill bg-white/5 border-white/10 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider shrink-0">Recent:</span>
            <span className="truncate italic text-white/90">
              "{messages[messages.length - 1].text}"
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40 shrink-0 ml-2">
            LATENCY: 42ms
          </span>
        </div>
      )}

      {/* Quick Tool Voice Prompts */}
      <div className="w-full space-y-2">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block text-center">
          Sample Sassy Commands (Click to Test Device Control)
        </span>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => triggerSampleSassyCommand('Call Mom right now')}
            className="px-3.5 py-1.5 glass-pill hover:border-cyan-500/50 text-slate-200 text-xs transition-all flex items-center space-x-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>"Call Mom right now"</span>
          </button>

          <button
            onClick={() => triggerSampleSassyCommand('Send WhatsApp to Sarah Chen saying Hey are we meeting at 5?')}
            className="px-3.5 py-1.5 glass-pill hover:border-emerald-500/50 text-slate-200 text-xs transition-all flex items-center space-x-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>"Send WhatsApp to Sarah"</span>
          </button>

          <button
            onClick={() => triggerSampleSassyCommand('Open YouTube for me')}
            className="px-3.5 py-1.5 glass-pill hover:border-red-500/50 text-slate-200 text-xs transition-all flex items-center space-x-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
            <span>"Open YouTube"</span>
          </button>

          <button
            onClick={() => triggerSampleSassyCommand('Email Boss Dave subject Project Update body Everything is on track!')}
            className="px-3.5 py-1.5 glass-pill hover:border-purple-500/50 text-slate-200 text-xs transition-all flex items-center space-x-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-purple-400" />
            <span>"Email Boss Dave"</span>
          </button>
        </div>
      </div>

      {/* Manual Voice & Text Input Controls */}
      <form onSubmit={handleFormSubmit} className="w-full flex items-center space-x-2">
        <button
          type="button"
          onClick={toggleListening}
          className={`p-3.5 rounded-full transition-all shadow-lg flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-pink-600 text-white animate-pulse shadow-pink-600/50'
              : 'glass-pill text-cyan-400 hover:text-white hover:border-cyan-400/50'
          }`}
          title={isListening ? 'Stop Mic' : 'Start Voice Listening'}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak or type a command for MAX..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/80 transition-all backdrop-blur-md"
        />

        <button
          type="submit"
          className="p-3.5 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white rounded-full shadow-lg transition-all shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
