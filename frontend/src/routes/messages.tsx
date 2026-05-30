import { useState, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, Send, User, Paperclip } from 'lucide-react';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/messages')({
  component: MessagesPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

const conversations = [
  { id: 1, name: 'Fatima Zohra', role: 'student', lastMsg: 'Assalamu Alaykum, I completed the assigned Surah revision', time: '5m ago', unread: 2 },
  { id: 2, name: 'Omar Al-Fayid', role: 'student', lastMsg: 'When is my next class scheduled?', time: '1h ago', unread: 0 },
  { id: 3, name: 'Aisha Mahmood', role: 'parent', lastMsg: 'Thank you for the progress update', time: '3h ago', unread: 1 },
  { id: 4, name: 'Suleiman Yusuf', role: 'student', lastMsg: 'I need help with Tajweed rules', time: '1d ago', unread: 0 },
  { id: 5, name: 'Admin Team', role: 'system', lastMsg: 'Weekly staff meeting tomorrow at 10am', time: '2d ago', unread: 0 },
];

function MessagesPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');

  const filtered = useMemo(() =>
    conversations.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    ),
    [conversations, search]
  );

  const selected = useMemo(() =>
    conversations.find(c => c.id === selectedId),
    [conversations, selectedId]
  );

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex h-[70vh]">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedId === conv.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm truncate">{conv.name}</span>
                      <span className="text-xs text-gray-400">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 truncate">{conv.lastMsg}</span>
                      {conv.unread > 0 && (
                        <Badge className="bg-emerald-600 text-white text-xs ml-2">{conv.unread}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                    <Badge className="bg-gray-100 text-gray-600 text-xs">{selected.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-sm">Messaging interface</p>
                  <p className="text-xs mt-1">Select a conversation to start chatting</p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5 text-gray-400" /></Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
