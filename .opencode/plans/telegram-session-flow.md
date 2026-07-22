# Plan: Telegram Session Flow with Manual Meeting Links

## Objective
Enable the teacher to start a live session with their own Zoom link, send Telegram notifications with Join/End buttons to students, and record attendance entirely through the platform (no Zoom APIs).

## Changes

### 1. `backend/src/zoom/zoom.module.ts` — Re-enable LiveSessionController only
- Keep all Zoom-specific controllers disabled (Webhook, OAuth, Settings, Analytics)
- Enable only `LiveSessionController`
- Keep `forwardRef(() => NotificationsModule)` and `forwardRef(() => TeachersModule)`

### 2. `backend/src/zoom/entities/session-attendance.entity.ts` — Add attendance fields
Add columns to match the required attendance schema:
- `teacherStartTime` (timestamp, nullable)
- `teacherEndTime` (timestamp, nullable)
- `teacherDuration` (int, nullable)
- `joinedViaTelegram` (boolean, default false)
- `invitationSentAt` (timestamp, nullable)
- `sessionStatus` (varchar, nullable — mirrors LiveSession.status at time of record)

### 3. `backend/src/telegram/telegram.service.ts` — Add editMessage method
```typescript
async editMessage(
  chatId: number,
  messageId: number,
  text: string,
  options?: TelegramMessage,
): Promise<boolean>
```
Sends `POST /bot<token>/editMessageText` with `chat_id`, `message_id`, `text`, `reply_markup`, `parse_mode`.
Also add `editMessageReplyMarkup(chatId, messageId, replyMarkup)` for just updating buttons without changing text.

### 4. `backend/src/notifications/notifications.service.ts` — Add notifyLiveSessionEnded + update buttons
- Add `notifyLiveSessionEnded(session: LiveSession)` method that sends:
  - **Teacher**: "Session completed successfully." via Telegram + system
  - **Student**: "Session completed." via Telegram + system
  - **Parent**: "Your child's Quran session has ended." via Telegram + system
- Update `notifyLiveSessionStarted` button labels:
  - Student buttons: `[ Join Session ]` (callback_data: `join:<sessionId>`) + meeting link URL
  - Teacher notification: include a `[ End Session ]` button (callback_data: `end:<sessionId>`)

### 5. `backend/src/zoom/live-session.service.ts` — Wire up end notification
- In `complete()` method, after finalizing attendance, call `notificationsService.notifyLiveSessionEnded(session)`

### 6. `backend/src/telegram/telegram.service.ts` — Handle end callback
- In `handleCallbackQuery()`, add handler for `data.startsWith('end:')`:
  - Look up the subscription, verify the user is a teacher
  - Call `liveSessionService.complete(sessionId)`
  - Edit the message to show "Session ended" with no buttons
  - Show answerCallbackQuery toast "Session ended successfully"

### 7. `backend/src/zoom/live-session.service.ts` — Fix startSession
- The `startSession()` method already stores `meetingLink` from body into `metadata.meetingLink`
- Ensure it calls `notifyLiveSessionStarted(session)` consistently
- Record `teacherJoinTime` = actualStart on the session itself

## Files Modified
| File | Change |
|------|--------|
| `backend/src/zoom/zoom.module.ts` | Re-enable LiveSessionController |
| `backend/src/zoom/entities/session-attendance.entity.ts` | Add teacher/telegram fields |
| `backend/src/zoom/live-session.service.ts` | Call notifyLiveSessionEnded in complete() |
| `backend/src/notifications/notifications.service.ts` | Add notifyLiveSessionEnded, update button labels |
| `backend/src/telegram/telegram.service.ts` | Add editMessage, handle end: callback |

## Files NOT Modified
- All Zoom-specific controllers remain disabled
- No changes to frontend (teacher dashboard still uses existing API calls)
- No changes to auth or user management
- No new database tables

## Verification
1. `cd backend && npm run build` — must compile clean
2. Deploy on Render — backend must start without DI errors
3. Test: POST /api/live-sessions/:id/start with meetingLink → Telegram sent with buttons
4. Test: Click Join button → attendance recorded
5. Test: POST /api/live-sessions/:id/end → Telegram "completed" notifications sent
