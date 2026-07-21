import React from 'react';
import { PermissionState } from '../types';
import { Mic, Contact, Phone, Bell, ShieldCheck, ShieldAlert, Sparkles, Check } from 'lucide-react';

interface PermissionsOnboardingProps {
  permissions: PermissionState;
  onTogglePermission: (key: keyof PermissionState) => void;
  onGrantAll: () => void;
}

export const PermissionsOnboarding: React.FC<PermissionsOnboardingProps> = ({
  permissions,
  onTogglePermission,
  onGrantAll,
}) => {
  const permissionList = [
    {
      key: 'RECORD_AUDIO' as const,
      title: 'RECORD_AUDIO (Microphone)',
      description: 'Allows MAX to hear continuous bi-directional 16kHz audio input & wake word "MAX".',
      icon: <Mic className="w-5 h-5 text-pink-400" />,
      sassyDenyQuote: "If you don't give me microphone access, I guess I'll just telepathically read your mind!",
    },
    {
      key: 'READ_CONTACTS' as const,
      title: 'READ_CONTACTS (Contacts Provider)',
      description: 'Allows MAX to search contacts for calling and WhatsApp messaging.',
      icon: <Contact className="w-5 h-5 text-cyan-400" />,
      sassyDenyQuote: "No contacts permission? Great, guess I'll just call random numbers for fun!",
    },
    {
      key: 'CALL_PHONE' as const,
      title: 'CALL_PHONE (Phone Dialer)',
      description: 'Allows MAX to directly trigger ACTION_CALL intents to make phone calls.',
      icon: <Phone className="w-5 h-5 text-emerald-400" />,
      sassyDenyQuote: "Honey, I can't place phone calls if you keep locking me out of phone permissions!",
    },
    {
      key: 'POST_NOTIFICATIONS' as const,
      title: 'POST_NOTIFICATIONS (Foreground Service)',
      description: 'Keeps MAX running reliably in background with a persistent Android notification.',
      icon: <Bell className="w-5 h-5 text-purple-400" />,
      sassyDenyQuote: "No notifications? Don't cry when Android OS battery saver puts me to sleep!",
    },
  ];

  const allGranted = Object.values(permissions).every(Boolean);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl backdrop-blur-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-2xl">
          <Sparkles className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>MAX Permissions Guardrails</span>
            {allGranted ? (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                All Granted
              </span>
            ) : (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                Action Needed
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Jetpack Compose runtime permission handlers linked to native Android tools.
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {permissionList.map((item) => {
          const isGranted = permissions[item.key];
          return (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isGranted
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-pink-950/20 border-pink-500/30 shadow-[0_0_15px_rgba(255,42,133,0.1)]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  {!isGranted && (
                    <p className="text-[11px] text-pink-400 italic mt-1.5 font-medium">
                      MAX says: "{item.sassyDenyQuote}"
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onTogglePermission(item.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                  isGranted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/30'
                }`}
              >
                {isGranted ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Granted</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Enable</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-400 text-center sm:text-left">
          {allGranted
            ? '✨ MAX has full device permission access to execute all voice tools!'
            : '⚠️ Enable permissions so MAX can execute native phone calls, WhatsApp & email tools.'}
        </span>
        <button
          onClick={onGrantAll}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Grant All Permissions</span>
        </button>
      </div>
    </div>
  );
};
