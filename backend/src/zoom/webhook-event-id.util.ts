import { createHash } from 'crypto';

/** Stable 64-char id for participant_timeline_events.webhookEventId (varchar 64). */
export function buildWebhookEventId(...parts: string[]): string {
  return createHash('sha256').update(parts.filter(Boolean).join('|')).digest('hex');
}
