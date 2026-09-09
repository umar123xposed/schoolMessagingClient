import { Conversation, User } from '@/types';
import { capitalizeName } from '@/lib/utils/formatters';

export interface ResolvedConversationDetails {
  title: string;
  subtitle: string;
  avatarName: string;
  isGroup: boolean;
  student: User | null;
  phoneNumber?: string;
  batchLabel?: string;
  batchId?: string;
}

export function resolveConversationDetails(
  conversation: Conversation,
  currentUser: User | null,
  userMap: Record<string, User> = {}
): ResolvedConversationDetails {
  const isGroup = conversation.type === 'agent_group';
  const isStudent = currentUser?.role === 'student';

  // For agent group chats
  if (isGroup) {
    const title = capitalizeName(conversation.name) || 'Group Chat';
    const participantCount = Array.isArray(conversation.participantIds)
      ? conversation.participantIds.length
      : 0;
    return {
      title,
      subtitle: `${participantCount} participants`,
      avatarName: title,
      isGroup: true,
      student: null,
    };
  }

  // If the viewing user is a student, their support conversation represents "School Support"
  if (isStudent) {
    return {
      title: 'School Support',
      subtitle: 'Official help desk & academic guidance',
      avatarName: 'School Support',
      isGroup: false,
      student: null,
    };
  }

  // For agents viewing a student conversation:
  // Identify the student user object
  let studentUser: User | null = null;
  if (typeof conversation.studentId === 'object' && conversation.studentId) {
    studentUser = conversation.studentId as User;
  } else if (typeof conversation.studentId === 'string' && userMap[conversation.studentId]) {
    studentUser = userMap[conversation.studentId];
  } else if ((conversation as unknown as { student?: User }).student) {
    studentUser = (conversation as unknown as { student: User }).student;
  }

  // Look in participantIds if studentUser is not yet resolved
  if (!studentUser && Array.isArray(conversation.participantIds)) {
    for (const p of conversation.participantIds) {
      if (typeof p === 'object' && p && (p.role === 'student' || p.name)) {
        studentUser = p as User;
        break;
      } else if (typeof p === 'string' && userMap[p] && userMap[p].role === 'student') {
        studentUser = userMap[p];
        break;
      }
    }
  }

  const rawName = studentUser?.name || (conversation.name && !conversation.name.toLowerCase().includes('support') ? conversation.name : undefined);
  const name = rawName ? capitalizeName(rawName) : undefined;
  const phoneNumber = studentUser?.phoneNumber;
  const batchId = studentUser?.batchId;
  const batchLabel =
    (studentUser as unknown as { batchName?: string })?.batchName ||
    (typeof (studentUser as unknown as { batchId?: { name?: string } })?.batchId === 'object'
      ? (studentUser as unknown as { batchId?: { name?: string } })?.batchId?.name
      : undefined) ||
    studentUser?.batchLabel;

  // Title prioritizes the student's name, then phone number, then conversation name
  let title = name || phoneNumber;
  if (!title) {
    if (conversation.name && !conversation.name.toLowerCase().includes('support')) {
      title = capitalizeName(conversation.name);
    } else if (typeof conversation.studentId === 'string' && conversation.studentId.length > 0) {
      title = `Student (${conversation.studentId.slice(-4)})`;
    } else {
      title = 'Student Support';
    }
  }

  // Subtitle showing phone number and cohort
  const subtitleParts: string[] = [];
  if (name && phoneNumber) subtitleParts.push(phoneNumber);
  if (batchLabel) subtitleParts.push(`Cohort: ${batchLabel}`);
  const subtitle = subtitleParts.join(' • ') || (phoneNumber || 'Student Support');

  return {
    title,
    subtitle,
    avatarName: name || title,
    isGroup: false,
    student: studentUser,
    phoneNumber,
    batchLabel,
    batchId,
  };
}

const SENDER_COLORS = [
  'text-emerald-400',
  'text-teal-400',
  'text-cyan-400',
  'text-sky-400',
  'text-blue-400',
  'text-indigo-400',
  'text-violet-400',
  'text-purple-400',
  'text-pink-400',
  'text-rose-400',
  'text-amber-400',
  'text-orange-400',
];

export function getSenderColorClass(str?: string): string {
  if (!str) return 'text-emerald-400';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}
