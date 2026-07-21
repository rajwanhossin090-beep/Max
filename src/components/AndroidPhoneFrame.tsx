import React from 'react';
import { Contact, InstalledApp, ToolCallPayload, VoiceMessage } from '../types';
import {
  Phone,
  MessageCircle,
  Mail,
  Youtube,
  Instagram,
  Calculator,
  Music,
  MapPin,
  Wifi,
  Battery,
  Signal,
  X,
  Send,
  ExternalLink,
  CheckCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface AndroidPhoneFrameProps {
  messages: VoiceMessage[];
  activeToolCall: ToolCallPayload | null;
  contacts: Contact[];
  apps: InstalledApp[];
  isForegroundServiceActive: boolean;
  onCloseActiveTool: () => void;
  onSimulateAppClick: (app: InstalledApp) => void;
}

export const AndroidPhoneFrame: React.FC<AndroidPhoneFrameProps> = ({
  messages,
  activeToolCall,
  contacts,
  apps,
  isForegroundServiceActive,
  onCloseActiveTool,
  onSimulateAppClick,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get current active view based on activeToolCall
  let activeAppScreen: InstalledApp | null = null;
  let activeContact: Contact | null = null;

  if (activeToolCall) {
    if (activeToolCall.toolName === 'openApp') {
      const pkg = activeToolCall.args.packageName;
      activeAppScreen = apps.find((a) => a.packageName === pkg) || {
        packageName: pkg,
        appName: activeToolCall.args.appName || 'Installed App',
        iconName: 'ExternalLink',
        category: 'App',
      };
    } else if (activeToolCall.toolName === 'searchAndCallContact') {
      const name = activeToolCall.args.contactName;
      activeContact = contacts.find((c) => c.name.toLowerCase().includes(name.toLowerCase())) || {
        id: '99',
        name,
        phone: '+1 (555) 019-2831',
        email: 'contact@android.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    } else if (activeToolCall.toolName === 'sendWhatsAppMessage') {
      const name = activeToolCall.args.contactName;
      activeContact = contacts.find((c) => c.name.toLowerCase().includes(name.toLowerCase())) || {
        id: '99',
        name,
        phone: '+1 (555) 019-2831',
        email: 'contact@android.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
    }
  }

  const renderAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Youtube':
        return <Youtube className="w-6 h-6 text-red-500" />;
      case 'Instagram':
        return <Instagram className="w-6 h-6 text-pink-500" />;
      case 'MessageCircle':
        return <MessageCircle className="w-6 h-6 text-emerald-400" />;
      case 'Mail':
        return <Mail className="w-6 h-6 text-red-400" />;
      case 'Music':
        return <Music className="w-6 h-6 text-green-400" />;
      case 'Calculator':
        return <Calculator className="w-6 h-6 text-orange-400" />;
      case 'MapPin':
        return <MapPin className="w-6 h-6 text-blue-400" />;
      default:
        return <Phone className="w-6 h-6 text-cyan-400" />;
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[370px] h-[680px] bg-slate-950 rounded-[48px] border-[10px] border-slate-800 shadow-[0_0_50px_rgba(0,242,254,0.15)] flex flex-col overflow-hidden select-none">
      {/* Phone Camera Punch Hole Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 border border-slate-800 shadow-inner" />

      {/* Realme narzo 70x Status Bar */}
      <div className="w-full h-9 bg-black/80 backdrop-blur-md px-6 pt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-40 border-b border-slate-900/50">
        <span>{currentTime}</span>
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-[9px] font-bold tracking-tighter text-cyan-400 border border-cyan-500/40 px-1 rounded">5G</span>
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <Signal className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center space-x-1">
            <span className="text-[10px]">88%</span>
            <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
          </div>
        </div>
      </div>

      {/* Foreground Service Persistent Banner */}
      {isForegroundServiceActive && (
        <div className="bg-gradient-to-r from-pink-950/90 via-slate-900 to-cyan-950/90 border-b border-pink-500/30 px-3 py-1.5 flex items-center justify-between z-30">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="text-[10px] font-medium text-slate-200">MAX Foreground Service Active</span>
          </div>
          <span className="text-[9px] text-cyan-400 font-bold">Wake: 'MAX'</span>
        </div>
      )}

      {/* Active Screen Content Container */}
      <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 relative overflow-y-auto custom-scrollbar">
        {/* ACTION MODE 1: CALLING SCREEN */}
        {activeToolCall && activeToolCall.toolName === 'searchAndCallContact' && activeContact && (
          <div className="absolute inset-0 bg-slate-950 z-30 p-6 flex flex-col items-center justify-between text-center animate-fade-in">
            <button
              onClick={onCloseActiveTool}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mt-8 flex flex-col items-center">
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase mb-2">MAX Phone Dialer</span>
              <img
                src={activeContact.avatar}
                alt={activeContact.name}
                className="w-24 h-24 rounded-full border-4 border-cyan-500 shadow-[0_0_20px_rgba(0,242,254,0.4)] object-cover mb-4"
              />
              <h3 className="text-xl font-bold text-white">{activeContact.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{activeContact.phone}</p>
              <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/40 animate-pulse">
                Calling via Android Intent...
              </span>
            </div>

            <div className="w-full space-y-4 mb-6">
              <div className="flex items-center justify-around text-slate-300">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-1">
                    <Phone className="w-5 h-5 text-slate-300" />
                  </div>
                  <span className="text-[10px]">Mute</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-1">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px]">Speaker</span>
                </div>
              </div>

              <a
                href={`tel:${activeContact.phone}`}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Phone className="w-5 h-5 fill-white" />
                <span>Trigger Real Call</span>
              </a>

              <button
                onClick={onCloseActiveTool}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl flex items-center justify-center space-x-2"
              >
                <span>End Call</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTION MODE 2: WHATSAPP DEEP-LINK SCREEN */}
        {activeToolCall && activeToolCall.toolName === 'sendWhatsAppMessage' && activeContact && (
          <div className="absolute inset-0 bg-slate-950 z-30 p-4 flex flex-col justify-between animate-fade-in">
            <div className="bg-emerald-950/80 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{activeContact.name}</h4>
                  <span className="text-[10px] text-emerald-400">WhatsApp Contact</span>
                </div>
              </div>
              <button onClick={onCloseActiveTool} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Chat Message Bubble */}
            <div className="my-auto space-y-3 p-2">
              <div className="bg-emerald-900/60 border border-emerald-600/40 rounded-2xl rounded-tr-none p-3 ml-auto max-w-[85%] text-slate-100 text-xs shadow-md">
                <p className="leading-relaxed">{activeToolCall.args.message}</p>
                <div className="text-[9px] text-emerald-300 text-right mt-1 flex items-center justify-end space-x-1">
                  <span>MAX Assistant</span>
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://web.whatsapp.com/send?text=${encodeURIComponent(activeToolCall.args.message)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Launch WhatsApp Intent</span>
              </a>

              <button
                onClick={onCloseActiveTool}
                className="w-full py-2 bg-slate-900 text-slate-400 hover:text-white text-xs font-medium rounded-xl border border-slate-800"
              >
                Close Intent
              </button>
            </div>
          </div>
        )}

        {/* ACTION MODE 3: GMAIL DRAFT SCREEN */}
        {activeToolCall && activeToolCall.toolName === 'sendGmail' && (
          <div className="absolute inset-0 bg-slate-950 z-30 p-4 flex flex-col justify-between animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-red-500" />
                <span className="text-xs font-bold text-white">Gmail Intent Draft</span>
              </div>
              <button onClick={onCloseActiveTool} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">To</span>
                <span className="text-xs font-medium text-cyan-400">{activeToolCall.args.recipientEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Subject</span>
                <span className="text-xs font-semibold text-white">{activeToolCall.args.subject}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Body</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  {activeToolCall.args.body}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`mailto:${activeToolCall.args.recipientEmail}?subject=${encodeURIComponent(activeToolCall.args.subject)}&body=${encodeURIComponent(activeToolCall.args.body)}`}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Open Gmail Client</span>
              </a>
              <button
                onClick={onCloseActiveTool}
                className="w-full py-2 bg-slate-900 text-slate-400 hover:text-white text-xs font-medium rounded-xl border border-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ACTION MODE 4: LAUNCHED APP SCREEN */}
        {activeToolCall && activeToolCall.toolName === 'openApp' && activeAppScreen && (
          <div className="absolute inset-0 bg-slate-950 z-30 p-4 flex flex-col justify-between animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                {renderAppIcon(activeAppScreen.iconName)}
                <span className="text-sm font-bold text-white">{activeAppScreen.appName}</span>
              </div>
              <button onClick={onCloseActiveTool} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl">
                {renderAppIcon(activeAppScreen.iconName)}
              </div>
              <h3 className="text-lg font-bold text-white">{activeAppScreen.appName} Launched</h3>
              <p className="text-xs text-slate-400 px-4">
                MAX executed native <code className="text-pink-400 font-mono">openApp("{activeAppScreen.packageName}")</code> intent.
              </p>
            </div>

            {activeAppScreen.deepLink ? (
              <a
                href={activeAppScreen.deepLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg text-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open {activeAppScreen.appName} Web App</span>
              </a>
            ) : (
              <button
                onClick={onCloseActiveTool}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Back to Home
              </button>
            )}
          </div>
        )}

        {/* DEFAULT HOME SCREEN & MAX CONVERSATION STREAM */}
        <div className="space-y-4">
          <div className="text-center py-2">
            <span className="text-[10px] font-bold tracking-widest text-pink-500 uppercase">Android OS Launcher</span>
            <p className="text-xs font-medium text-slate-300">MAX Voice Assistant Active</p>
          </div>

          {/* Quick App Drawer Bar */}
          <div className="grid grid-cols-4 gap-2 bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
            {apps.slice(0, 4).map((app) => (
              <button
                key={app.packageName}
                onClick={() => onSimulateAppClick(app)}
                className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-800/80 transition-all group"
              >
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-cyan-500/50">
                  {renderAppIcon(app.iconName)}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">{app.appName}</span>
              </button>
            ))}
          </div>

          {/* Live MAX Assistant Voice Feed */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 border-b border-slate-800 pb-1">
              <span>Voice Interaction History</span>
              <span className="text-cyan-400 font-mono text-[10px]">gemini-3.1-flash-live</span>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Sparkles className="w-8 h-8 text-pink-500/40 mx-auto mb-2 animate-bounce" />
                <p>Tap MAX orb or speak "MAX" to start casual sassy banter!</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 rounded-br-none'
                        : 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 border border-pink-500/40 text-pink-100 rounded-bl-none shadow-md'
                    }`}
                  >
                    {m.sender === 'max' && (
                      <span className="text-[9px] font-black tracking-wider text-pink-400 block uppercase mb-1">
                        MAX 🔥
                      </span>
                    )}
                    <p>{m.text}</p>
                    {m.toolCall && (
                      <div className="mt-2 pt-2 border-t border-pink-500/30 flex items-center space-x-1.5 text-[10px] text-cyan-300 font-mono">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Tool Executed: {m.toolCall.toolName}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Realme narzo 70x Navigation Bar */}
      <div className="w-full h-8 bg-black/90 border-t border-slate-900 flex items-center justify-center space-x-12 z-40">
        <div className="w-3 h-3 border-2 border-slate-500 rotate-45 border-r-0 border-b-0" />
        <div className="w-3 h-3 rounded-full border-2 border-slate-500" />
        <div className="w-3 h-3 border-2 border-slate-500" />
      </div>
    </div>
  );
};
