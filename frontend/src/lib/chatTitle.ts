const CHAT_TITLE_MAX_LENGTH = 34;

export function formatChatTitle(title: string): string {
  const normalized = title.trim();
  if (normalized.length <= CHAT_TITLE_MAX_LENGTH) return normalized;
  return `${normalized.slice(0, CHAT_TITLE_MAX_LENGTH).trimEnd()}...`;
}
