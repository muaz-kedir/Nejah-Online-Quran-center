import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, apiHeaders, API_BASE, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { toast } from 'sonner';

function StudentMessages() {
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const teacherId = profile?.messaging?.teacherId;
  const teacherName = profile?.messaging?.teacherName || 'Teacher';

  const loadMessages = async (otherId: string) => {
    const res = await fetch(
      `${API_BASE}/messages/conversations/${otherId}?role=teacher`,
      { headers: apiHeaders() },
    );
    if (res.ok) {
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const p = await api('/student/profile');
        setProfile(p);
        if (p?.messaging?.teacherId) {
          await loadMessages(p.messaging.teacherId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSend = async () => {
    if (!teacherId || !subject.trim() || !body.trim()) {
      toast.error('Enter subject and message');
      return;
    }
    setSending(true);
    try {
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          toId: teacherId,
          toRole: 'teacher',
          subject,
          body,
        }),
      });
      toast.success('Message sent');
      setSubject('');
      setBody('');
      await loadMessages(teacherId);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.messages}>
      <main className="flex-1 px-10 py-10 max-w-3xl">
        <div className="mb-8">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-nejah-sapphire font-serif">Messages</h1>
          <p className="text-sm text-muted-foreground mt-2">Chat with your assigned teacher</p>
        </div>

        {!teacherId ? (
          <div className="bg-muted rounded-3xl p-12 text-center border">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No teacher assigned yet. Contact admin for support.</p>
          </div>
        ) : (
          <>
            <div className="bg-primary/10 rounded-2xl px-4 py-3 mb-6 border border-primary/100">
              <p className="text-sm font-bold text-nejah-sapphire">Conversation with {teacherName}</p>
            </div>

            <div className="bg-muted rounded-2xl p-4 min-h-[280px] max-h-[400px] overflow-y-auto mb-6 space-y-3 border">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">No messages yet. Start the conversation below.</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.fromRole === 'student';
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        isMine ? 'ml-auto bg-primary text-white' : 'bg-white border text-foreground'
                      }`}
                    >
                      {m.subject && <p className="font-bold text-xs mb-1 opacity-80">{m.subject}</p>}
                      <p>{m.body}</p>
                      <p className="text-[10px] mt-2 opacity-60">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3 bg-white border rounded-2xl p-4">
              <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Your message..." rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
              <Button className="bg-primary w-full" onClick={handleSend} disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </>
        )}
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/messages')({
  component: StudentMessages,
  beforeLoad: requireStudentAuth,
});
