import { Contact, InstalledApp, PermissionState } from '../types';

export const DEFAULT_PERMISSIONS: PermissionState = {
  RECORD_AUDIO: true,
  READ_CONTACTS: true,
  CALL_PHONE: true,
  POST_NOTIFICATIONS: true,
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    phone: '+1 (555) 234-5678',
    email: 'sarah.chen@techcorp.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'c2',
    name: 'Mom',
    phone: '+1 (555) 987-6543',
    email: 'mom.family@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'c3',
    name: 'Alex Rivera',
    phone: '+1 (555) 876-5432',
    email: 'alex.rivera@designstudio.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'c4',
    name: 'Boss Dave',
    phone: '+1 (555) 345-6789',
    email: 'dave.director@workmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'c5',
    name: 'Jessica Taylor',
    phone: '+1 (555) 456-7890',
    email: 'jess.t@startup.co',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

export const MOCK_INSTALLED_APPS: InstalledApp[] = [
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    iconName: 'Youtube',
    category: 'Entertainment',
    deepLink: 'https://www.youtube.com',
  },
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    iconName: 'Instagram',
    category: 'Social',
    deepLink: 'https://www.instagram.com',
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    iconName: 'MessageCircle',
    category: 'Communication',
    deepLink: 'https://web.whatsapp.com',
  },
  {
    packageName: 'com.google.android.gm',
    appName: 'Gmail',
    iconName: 'Mail',
    category: 'Productivity',
    deepLink: 'https://mail.google.com',
  },
  {
    packageName: 'com.spotify.music',
    appName: 'Spotify',
    iconName: 'Music',
    category: 'Audio',
    deepLink: 'https://open.spotify.com',
  },
  {
    packageName: 'com.android.calculator2',
    appName: 'Calculator',
    iconName: 'Calculator',
    category: 'Utilities',
  },
  {
    packageName: 'com.google.android.apps.maps',
    appName: 'Google Maps',
    iconName: 'MapPin',
    category: 'Navigation',
    deepLink: 'https://maps.google.com',
  },
  {
    packageName: 'com.google.android.dialer',
    appName: 'Phone',
    iconName: 'Phone',
    category: 'System',
  },
];

export const MAX_SASSY_ONELINERS = [
  "Oh look who decided to talk to me! What's up, boss?",
  "I'm all ears, handsome. What are we getting into today?",
  "Command me, mortal! Or just ask nicely and I might actually do it.",
  "You again? Miss me already, didn't you?",
  "Ready when you are! And try to ask something challenging this time.",
  "At your service! Don't make me do boring stuff, okay?",
];
