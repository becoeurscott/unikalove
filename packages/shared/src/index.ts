export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum Plan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  PREMIUM_PLUS = 'PREMIUM_PLUS',
}

export enum SwipeType {
  PASS = 'PASS',
  LIKE = 'LIKE',
  SUPERLIKE = 'SUPERLIKE',
  FAVORITE = 'FAVORITE',
}

export enum MatchStatus {
  ACTIVE = 'ACTIVE',
  UNMATCHED = 'UNMATCHED',
  EXPIRED = 'EXPIRED',
}

export enum MessageType {
  TEXT = 'TEXT',
  GIF = 'GIF',
  PHOTO = 'PHOTO',
}

export enum ReportCategory {
  FAKE_PROFILE = 'FAKE_PROFILE',
  SCAM = 'SCAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  UNDERAGE = 'UNDERAGE',
  OTHER = 'OTHER',
}

export enum NotificationType {
  NEW_MATCH = 'NEW_MATCH',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_LIKE = 'NEW_LIKE',
  VERIFICATION = 'VERIFICATION',
  SYSTEM = 'SYSTEM',
}

export const FREE_DAILY_LIKE_LIMIT = 20;

/** Realtime event names shared by the gateway and web clients. */
export const RT = {
  MESSAGE_SEND: 'message.send',
  MESSAGE_NEW: 'message.new',
  TYPING: 'typing',
  READ: 'read',
  REACTION: 'reaction',
  MATCH_NEW: 'match.new',
} as const;
