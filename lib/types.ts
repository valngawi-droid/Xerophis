// Shared client shapes (mirrors API responses)

export type CurrentUser = {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarColor: string;
  isVerified: boolean;
  online: boolean;
  lastSeen: number | null;
};

export type SettingsBundle = {
  privacy: Record<string, unknown> | null;
  chat: Record<string, unknown> | null;
  notifications: Record<string, unknown> | null;
};

export type ChatItem = {
  id: string;
  type: string;
  name: string;
  avatar: string;
  avatarColor: string;
  description: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  muted: boolean;
  pinned: boolean;
  online: boolean;
  memberCount: number;
  verified: boolean;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  from: "me" | "them";
  senderName: string;
  text: string;
  kind: string;
  mediaUrl?: string | null;
  replyTo: string | null;
  status: string;
  time: string;
  date: string;
  reactions: string[];
};

export type ConversationInfo = {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  members: Array<{
    id: string;
    displayName: string;
    username: string;
    avatar: string;
    online: boolean;
    verified: boolean;
    role: string;
  }>;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  conversationId: string | null;
  createdAt: number;
};
