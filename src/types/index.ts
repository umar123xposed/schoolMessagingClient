export type UserRole = 'student' | 'agent' | 'super_admin';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
  batchId?: string;
  batchLabel?: string;
  notes?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  createdAt?: string;
}

export interface Batch {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type ConversationType = 'student_support' | 'agent_group';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  studentId?: string | User;
  participantIds?: (string | User)[];
  name?: string;
  labels?: (string | Label)[];
  createdBy?: string;
  lastMessageAt?: string;
  lastMessage?: Message;
  unreadCount?: number;
  lastReadAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MessageContentType =
  | 'text'
  | 'image'
  | 'audio'
  | 'voice_note'
  | 'video'
  | 'pdf'
  | 'file';

export interface Attachment {
  url: string;
  mimeType: string;
  size: number;
  fileName: string;
  duration?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string | User;
  contentType: MessageContentType;
  text?: string;
  attachment?: Attachment;
  isPinned?: boolean;
  pinnedBy?: string | User;
  pinnedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  isBroadcast?: boolean;
  broadcastGroupId?: string;
  createdAt: string;
  updatedAt?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'error';
  tempId?: string;
  uploadProgress?: number;
}

export interface SendMessagePayload {
  contentType: MessageContentType;
  text?: string;
  attachment?: Attachment;
}

export interface Template {
  id: string;
  shortcut: string;
  content: string;
  createdBy?: string;
  createdAt?: string;
}

export interface StorageStatsBatch {
  batchId?: string | null;
  batchName?: string;
  batchLabel?: string;
  studentCount: number;
  conversationCount: number;
  messageCount: number;
  attachmentCount: number;
  attachmentBytes?: number;
  totalSizeBytes?: number;
}

export interface StorageStatsTotal {
  studentCount: number;
  conversationCount: number;
  messageCount: number;
  attachmentCount: number;
  attachmentBytes?: number;
  totalSizeBytes?: number;
}

export interface StorageStats {
  batches: StorageStatsBatch[];
  total?: StorageStatsTotal;
  totals?: StorageStatsTotal;
}

export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BatchDeletionJob {
  id: string;
  batchId?: string;
  batchName?: string;
  batchLabel?: string;
  status: BatchJobStatus;
  triggeredBy?: string;
  requestedBy?: string;
  startedAt?: string;
  finishedAt?: string;
  counts?: {
    students?: number;
    conversations?: number;
    messages?: number;
    attachmentsDeleted?: number;
    studentsDeleted?: number;
    conversationsDeleted?: number;
    messagesDeleted?: number;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PaginatedResult<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface ImportedStudent {
  id?: string;
  _id?: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role?: UserRole;
  batchId?: string;
  temporaryPassword?: string;
  password?: string;
  createdAt?: string;
}

export interface ImportStudentsResponse {
  results?: ImportedStudent[];
  students?: ImportedStudent[];
  created?: ImportedStudent[];
  count?: number;
  message?: string;
  [key: string]: unknown;
}
