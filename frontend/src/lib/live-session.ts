import { apiHeaders, apiUrl } from '@/lib/api';

export type StudentJoinSessionResult = {
  sessionId: string;
  joinUrl: string;
  zoomJoinUrl?: string;
  status: string;
  alreadyJoined?: boolean;
  attendance?: {
    id: string;
    joinTime: string;
    attendanceStatus: string;
  } | null;
};

/**
 * Record student attendance via the backend, then return the Zoom join URL.
 * Throws if attendance cannot be recorded (caller should not open Zoom).
 */
export async function joinLiveSessionAsStudent(sessionId: string): Promise<StudentJoinSessionResult> {
  const res = await fetch(apiUrl(`/live-sessions/${sessionId}/join`), {
    method: 'POST',
    headers: apiHeaders(),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || 'Failed to record attendance and join session');
  }

  const joinUrl = body.joinUrl || body.zoomJoinUrl;
  if (!joinUrl) {
    throw new Error('Meeting link is not available yet. Please try again in a moment.');
  }

  return {
    sessionId: body.sessionId || sessionId,
    joinUrl,
    zoomJoinUrl: body.zoomJoinUrl || joinUrl,
    status: body.status,
    alreadyJoined: body.alreadyJoined,
    attendance: body.attendance,
  };
}

export function openZoomMeeting(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
