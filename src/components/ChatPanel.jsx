import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';

export function ChatPanel({ messages, onSend, isOpen, onToggle, unreadCount }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute right-3 top-3 z-20 w-9 h-9 rounded-lg bg-secondary/90 border border-border/50 flex items-center justify-center hover:bg-muted active:scale-[0.95] transition-all backdrop-blur-sm"
      >
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold shadow-sm shadow-primary/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-72 border-l border-border/50 flex flex-col cs-sidebar animate-slide-in-right">
      <div className="h-11 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
        <span className="text-xs font-bold text-foreground">Chat</span>
        <button onClick={onToggle} className="w-6 h-6 rounded flex items-center justify-center hover:bg-secondary transition-colors">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground">No messages yet</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`animate-fade-in ${msg.userId === 'system' ? 'text-center' : ''}`}>
            {msg.userId === 'system' ? (
              <span className="text-[10px] text-muted-foreground/60 italic">{msg.content}</span>
            ) : (
              <div className="group">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] font-semibold text-foreground">{msg.username}</span>
                  <span className="text-[9px] text-muted-foreground/50">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[12px] text-secondary-foreground mt-0.5 break-words leading-relaxed">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border/50 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="cs-input !h-9 !text-xs !px-3"
          />
          <button onClick={handleSend} className="w-9 h-9 shrink-0 rounded-lg bg-primary flex items-center justify-center hover:brightness-110 active:scale-[0.95] transition-all shadow-sm shadow-primary/20">
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}