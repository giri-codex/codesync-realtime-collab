import { Users, Lock, Unlock, History, Code2 } from 'lucide-react';
import { useState } from 'react';

export function EditorSidebar({ room, currentUserId, onToggleLock, onRestoreSnapshot }) {
  const [tab, setTab] = useState('users');
  const isOwner = room.ownerId === currentUserId;

  return (
    <div className="w-56 cs-sidebar border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground tracking-wide">CodeSync</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
            {room.id}
          </span>
          {room.isLocked && <Lock className="w-3 h-3 text-destructive" />}
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('users')}
          className={`flex-1 text-[11px] py-2 font-medium transition-colors ${tab === 'users' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1" /> Users ({room.users.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 text-[11px] py-2 font-medium transition-colors ${tab === 'history' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <History className="w-3.5 h-3.5 inline mr-1" /> History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {tab === 'users' && room.users.map(user => (
          <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <span className="text-xs text-foreground truncate">{user.username}</span>
            {user.id === room.ownerId && (
              <span className="text-[9px] bg-primary/20 text-primary px-1 rounded ml-auto">owner</span>
            )}
          </div>
        ))}

        {tab === 'history' && (
          room.snapshots.length === 0
            ? <p className="text-xs text-muted-foreground p-2">No snapshots yet</p>
            : room.snapshots.slice().reverse().map(snap => (
              <button
                key={snap.id}
                onClick={() => onRestoreSnapshot(snap)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors"
              >
                <div className="text-xs text-foreground">{snap.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {snap.timestamp.toLocaleTimeString()} · {snap.language}
                </div>
              </button>
            ))
        )}
      </div>

      {isOwner && (
        <div className="p-2 border-t border-border">
          <button
            onClick={onToggleLock}
            className="w-full h-8 text-[11px] rounded flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground hover:bg-muted active:scale-[0.97] transition-all"
          >
            {room.isLocked ? <><Unlock className="w-3.5 h-3.5" /> Unlock Room</> : <><Lock className="w-3.5 h-3.5" /> Lock Room</>}
          </button>
        </div>
      )}
    </div>
  );
}