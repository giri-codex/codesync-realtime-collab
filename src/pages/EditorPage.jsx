import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChatPanel } from '@/components/ChatPanel';
import { OutputTerminal } from '@/components/OutputTerminal';
import { Play, Copy, Check, LogOut, Save, Lock, Unlock, Users, Loader2, Code2, ChevronLeft } from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js', color: 'hsl(50, 90%, 50%)' },
  { id: 'python', label: 'Python', ext: 'py', color: 'hsl(210, 65%, 50%)' },
  { id: 'java', label: 'Java', ext: 'java', color: 'hsl(20, 80%, 50%)' },
  { id: 'cpp', label: 'C++', ext: 'cpp', color: 'hsl(200, 60%, 50%)' },
  { id: 'html', label: 'HTML', ext: 'html', color: 'hsl(12, 80%, 55%)' },
  { id: 'css', label: 'CSS', ext: 'css', color: 'hsl(264, 60%, 55%)' },
];

const EditorPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [chatOpen, setChatOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [members, setMembers] = useState([]);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const lastMsgCount = useRef(0);
  const skipNextUpdate = useRef(false);

  useEffect(() => {
    if (!roomId || !user) return;
    const load = async () => {
      const { data: roomData } = await supabase
        .from('rooms').select('*').eq('room_code', roomId).single();

      if (!roomData) { navigate('/dashboard'); return; }

      await supabase.from('room_members').upsert({ room_id: roomData.id, user_id: user.id });

      setRoom(roomData);
      setCode(roomData.code);
      setLanguage(roomData.language);
      setLoading(false);

      const { data: membersData } = await supabase
        .from('room_members').select('user_id').eq('room_id', roomData.id);

      if (membersData) {
        const profiles = await Promise.all(
          membersData.map(async m => {
            const { data } = await supabase.from('profiles').select('display_name').eq('user_id', m.user_id).single();
            return { user_id: m.user_id, display_name: data?.display_name || 'Anonymous' };
          })
        );
        setMembers(profiles);
      }

      const { count } = await supabase.from('code_snapshots').select('*', { count: 'exact', head: true }).eq('room_id', roomData.id);
      setSnapshotCount(count || 0);
    };
    load();
  }, [roomId, user, navigate]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const updated = payload.new;
        if (skipNextUpdate.current) { skipNextUpdate.current = false; return; }
        setCode(updated.code);
        setLanguage(updated.language);
        setRoom(prev => prev ? { ...prev, ...updated } : null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  const handleCodeChange = useCallback(async (value) => {
    if (!room || value === undefined) return;
    setCode(value);
    skipNextUpdate.current = true;
    await supabase.from('rooms').update({ code: value }).eq('id', room.id);
  }, [room?.id]);

  const handleLanguageChange = async (lang) => {
    if (!room) return;
    setLanguage(lang);
    skipNextUpdate.current = true;
    await supabase.from('rooms').update({ language: lang }).eq('id', room.id);
  };

  const handleSaveSnapshot = async () => {
    if (!room || !user) return;
    setSaving(true);
    await supabase.from('code_snapshots').insert({
      room_id: room.id, user_id: user.id, code, language,
      label: `Snapshot ${snapshotCount + 1}`,
    });
    setSnapshotCount(prev => prev + 1);
    setTimeout(() => setSaving(false), 800);
  };

  const handleToggleLock = async () => {
    if (!room || !user || room.owner_id !== user.id) return;
    const newLock = !room.is_locked;
    await supabase.from('rooms').update({ is_locked: newLock }).eq('id', room.id);
    setRoom(prev => prev ? { ...prev, is_locked: newLock } : null);
  };

  const handleRun = () => {
    if (language !== 'javascript') {
      setOutput(`⚠ Execution is only supported for JavaScript.\n\nSelected: ${language}`);
      setTerminalOpen(true);
      return;
    }
    setIsRunning(true); setTerminalOpen(true); setOutput('');
    setTimeout(() => {
      try {
        const logs = [];
        const fakeConsole = {
          log: (...args) => logs.push(args.map(String).join(' ')),
          error: (...args) => logs.push('Error: ' + args.map(String).join(' ')),
        };
        const fn = new Function('console', code);
        fn(fakeConsole);
        setOutput(logs.join('\n') || '(no output)');
      } catch (err) { setOutput(`Error: ${err.message}`); }
      setIsRunning(false);
    }, 500);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLeave = async () => {
    if (room && user) await supabase.from('room_members').delete().eq('room_id', room.id).eq('user_id', user.id);
    navigate('/dashboard');
  };

  const handleSendMessage = (content) => {
    if (!user) return;
    const msg = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: members.find(m => m.user_id === user.id)?.display_name || 'You',
      content, timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    lastMsgCount.current = messages.length + 1;
  };

  useEffect(() => {
    if (!chatOpen && messages.length > lastMsgCount.current) setUnreadCount(messages.length - lastMsgCount.current);
  }, [messages.length, chatOpen]);

  useEffect(() => {
    if (chatOpen) { setUnreadCount(0); lastMsgCount.current = messages.length; }
  }, [chatOpen]);

  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading editor...</span>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-11 cs-titlebar border-b border-border/50 flex items-center px-3 gap-2 shrink-0">
        <button onClick={() => navigate('/dashboard')} className="cs-btn-ghost !h-7 !px-2 !text-[11px] gap-1">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded cs-gradient flex items-center justify-center">
            <Code2 className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-xs font-bold text-foreground">CodeSync</span>
        </div>
        <div className="h-4 w-px bg-border/50 mx-1" />

        <button onClick={handleCopyRoomId} className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary">
          {roomId}
          {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
        </button>

        <select
          value={language}
          onChange={e => handleLanguageChange(e.target.value)}
          className="h-7 text-[11px] bg-secondary/80 border border-border/50 rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 cursor-pointer"
        >
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-1 rounded bg-secondary/40">
          <Users className="w-3 h-3" /> {members.length}
        </div>

        <div className="flex-1" />

        <button onClick={handleRun} className="h-7 px-3 rounded-md text-[11px] font-semibold bg-accent text-accent-foreground flex items-center gap-1.5 hover:brightness-110 active:scale-[0.96] transition-all shadow-sm shadow-accent/20">
          <Play className="w-3 h-3" /> Run
        </button>

        <button onClick={handleSaveSnapshot} disabled={saving} className="h-7 px-3 rounded-md text-[11px] font-medium bg-secondary/80 text-secondary-foreground border border-border/50 hover:bg-muted active:scale-[0.96] transition-all flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Check className="w-3 h-3 text-accent" /> : <Save className="w-3 h-3" />}
          {saving ? 'Saved' : 'Save'}
        </button>

        {user?.id === room.owner_id && (
          <button onClick={handleToggleLock} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" title={room.is_locked ? 'Unlock room' : 'Lock room'}>
            {room.is_locked ? <Lock className="w-3.5 h-3.5 text-destructive" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        )}

        <button onClick={handleLeave} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Leave room">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-52 cs-sidebar border-r border-border/50 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Members</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-foreground hover:bg-secondary/60 transition-colors">
                <div className="w-6 h-6 rounded-full cs-gradient flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0">
                  {m.display_name[0].toUpperCase()}
                </div>
                <span className="truncate text-[12px]">{m.display_name}</span>
                {m.user_id === room.owner_id && (
                  <span className="cs-badge bg-primary/15 text-primary ml-auto">owner</span>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Snapshots</span>
              <span className="font-mono font-medium text-foreground">{snapshotCount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Language</span>
              <span className="font-medium text-foreground capitalize">{language}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-9 flex items-center border-b border-border/50 cs-titlebar px-1">
            <div className="flex items-center h-full">
              <div className="h-full px-4 flex items-center gap-2 text-[11px] text-foreground cs-editor border-t-2 border-primary font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentLang.color }} />
                main.{currentLang.ext}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                autoIndent: 'full',
                formatOnPaste: true,
                padding: { top: 16 },
                smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                renderLineHighlight: 'line',
                fontLigatures: true,
                lineHeight: 22,
              }}
            />
          </div>

          <OutputTerminal output={output} isOpen={terminalOpen} onToggle={() => setTerminalOpen(!terminalOpen)} isRunning={isRunning} />
        </div>

        <ChatPanel messages={messages} onSend={handleSendMessage} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} unreadCount={unreadCount} />
      </div>

      <div className="h-6 cs-status-bar flex items-center px-4 gap-4 shrink-0">
        <span className="text-[10px] text-primary-foreground/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          {members.length} connected
        </span>
        <span className="text-[10px] text-primary-foreground/50">{currentLang.label}</span>
        <span className="text-[10px] text-primary-foreground/50">Snapshots: {snapshotCount}</span>
        <span className="text-[10px] text-primary-foreground/50 ml-auto">CodeSync v1.0</span>
      </div>
    </div>
  );
};

export default EditorPage;