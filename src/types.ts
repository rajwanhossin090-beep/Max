export type MaxState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface PermissionState {
  RECORD_AUDIO: boolean;
  READ_CONTACTS: boolean;
  CALL_PHONE: boolean;
  POST_NOTIFICATIONS: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  iconName: string;
  category: string;
  deepLink?: string;
}

export interface ToolCallPayload {
  toolName: 'openApp' | 'searchAndCallContact' | 'sendWhatsAppMessage' | 'sendGmail';
  args: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'success' | 'failed' | 'permission_denied';
  resultMessage?: string;
}

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'max';
  text: string;
  timestamp: Date;
  toolCall?: ToolCallPayload;
  audioUrl?: string;
  sassyEmotion?: 'confident' | 'playful' | 'teasing' | 'sarcastic' | 'caring';
}

export interface AndroidCodeFile {
  path: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'properties';
  content: string;
  description: string;
}
