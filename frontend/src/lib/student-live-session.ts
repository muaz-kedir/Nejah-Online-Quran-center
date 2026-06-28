import { joinLiveSessionAsStudent, openZoomMeeting } from '@/lib/live-session';

/** True when the teacher has started the session (status LIVE). */
export function isLiveSessionActive(status?: string | null): boolean {
  return String(status || '').toUpperCase() === 'LIVE';
}

export async function joinLiveSessionWhenActive(sessionId: string, status?: string | null) {
  if (!sessionId) {
    throw new Error('No live session is available yet.');
  }
  if (!isLiveSessionActive(status)) {
    throw new Error('Your teacher has not started the session yet. Please wait.');
  }
  const result = await joinLiveSessionAsStudent(sessionId);
  openZoomMeeting(result.joinUrl);
  return result;
}
