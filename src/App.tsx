import React, { useState } from 'react';
import { PermissionState, ToolCallPayload, VoiceMessage, Contact, InstalledApp } from './types';
import { DEFAULT_PERMISSIONS, MOCK_CONTACTS, MOCK_INSTALLED_APPS } from './data/mockData';
import { Header } from './components/Header';
import { VoiceAssistantController } from './components/VoiceAssistantController';
import { AndroidPhoneFrame } from './components/AndroidPhoneFrame';
import { PermissionsOnboarding } from './components/PermissionsOnboarding';
import { AndroidCodeExplorer } from './components/AndroidCodeExplorer';
import { Sparkles, Smartphone, Code, ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'code' | 'permissions'>('assistant');
  const [permissions, setPermissions] = useState<PermissionState>(DEFAULT_PERMISSIONS);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [activeToolCall, setActiveToolCall] = useState<ToolCallPayload | null>(null);
  const [isForegroundServiceActive, setIsForegroundServiceActive] = useState<boolean>(true);

  const handleTogglePermission = (key: keyof PermissionState) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGrantAllPermissions = () => {
    setPermissions({
      RECORD_AUDIO: true,
      READ_CONTACTS: true,
      CALL_PHONE: true,
      POST_NOTIFICATIONS: true,
    });
  };

  const handleSimulateAppClick = (app: InstalledApp) => {
    const toolCall: ToolCallPayload = {
      toolName: 'openApp',
      args: { packageName: app.packageName, appName: app.appName },
      timestamp: Date.now(),
      status: 'success',
    };
    setActiveToolCall(toolCall);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col font-sans relative overflow-x-hidden selection:bg-pink-500/30 selection:text-pink-200">
      {/* Immersive UI Atmospheric Background */}
      <div className="atmosphere" />

      {/* Decorative Corner Accent Lines */}
      <div className="absolute top-0 right-0 p-4 pointer-events-none z-10">
        <div className="w-32 h-[1px] bg-gradient-to-l from-cyan-400/30 to-transparent" />
        <div className="h-32 w-[1px] bg-gradient-to-t from-pink-500/30 to-transparent absolute top-0 right-0" />
      </div>

      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isForegroundServiceActive={isForegroundServiceActive}
        onToggleForegroundService={() => setIsForegroundServiceActive((prev) => !prev)}
      />

      {/* Main View Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Interactive Voice Controller */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  <span className="text-sm font-bold text-white tracking-wide">Gemini 3.1 Live Audio Engine</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono glass-pill px-3 py-1">
                  Voice Persona: Sassy MAX
                </span>
              </div>

              <VoiceAssistantController
                permissions={permissions}
                contacts={MOCK_CONTACTS}
                apps={MOCK_INSTALLED_APPS}
                messages={messages}
                setMessages={setMessages}
                activeToolCall={activeToolCall}
                setActiveToolCall={setActiveToolCall}
                isForegroundServiceActive={isForegroundServiceActive}
              />
            </div>

            {/* Right Column: Realme narzo 70x Android Phone Frame Simulator */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Realme narzo 70x 5G Screen</span>
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono glass-pill px-2 py-0.5">Android 15</span>
              </div>

              <AndroidPhoneFrame
                messages={messages}
                activeToolCall={activeToolCall}
                contacts={MOCK_CONTACTS}
                apps={MOCK_INSTALLED_APPS}
                isForegroundServiceActive={isForegroundServiceActive}
                onCloseActiveTool={() => setActiveToolCall(null)}
                onSimulateAppClick={handleSimulateAppClick}
              />
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <AndroidCodeExplorer />
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <PermissionsOnboarding
              permissions={permissions}
              onTogglePermission={handleTogglePermission}
              onGrantAll={handleGrantAllPermissions}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-[#050505]/90 border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center space-x-1">
          <span>MAXAssistant APK &bull; Google AI Studio Build &bull; Powered by Gemini Live API & Jetpack Compose</span>
        </p>
      </footer>
    </div>
  );
}
