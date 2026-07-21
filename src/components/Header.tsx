import React from 'react';
import { Mic, Code, ShieldCheck, Sparkles, Smartphone, Bell, Power } from 'lucide-react';

interface HeaderProps {
  activeTab: 'assistant' | 'code' | 'permissions';
  setActiveTab: (tab: 'assistant' | 'code' | 'permissions') => void;
  isForegroundServiceActive: boolean;
  onToggleForegroundService: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isForegroundServiceActive,
  onToggleForegroundService,
}) => {
  return (
    <header className="w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F0FF] via-[#7B00FF] to-[#FF00E5] orb-glow">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#050505]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                MAX <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">v3.1 LIVE</span>
              </h1>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-0.5">
              Gemini Flash Core &bull; Jetpack Compose Android Architecture
            </p>
          </div>
        </div>

        {/* Foreground Service Toggle & Status */}
        <div className="glass-pill px-4 py-1.5 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleForegroundService}
              className={`p-1.5 rounded-full transition-all ${
                isForegroundServiceActive
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/40'
                  : 'bg-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Android Foreground Service"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isForegroundServiceActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[11px] font-mono tracking-wider text-slate-200">
                SERVICE: {isForegroundServiceActive ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-[10px] font-mono text-cyan-300 flex items-center space-x-1">
            <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Wake: "MAX"</span>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <nav className="glass-pill p-1 flex items-center space-x-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
              activeTab === 'assistant'
                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Android Source</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
              activeTab === 'permissions'
                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permissions</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
