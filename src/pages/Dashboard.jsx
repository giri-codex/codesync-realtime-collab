import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Code2, Plus, LogOut, Clock, ArrowRight, Loader2, Trash2, History, Users, Search, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';

const LANG_COLORS = {
  javascript: 'hsl(50, 90%, 50%)',
  python: 'hsl(210, 65%, 50%)',
  java: 'hsl(20, 80%, 50%)',
  cpp: 'hsl(200, 60%, 50%)',
  html: 'hsl(12, 80%, 55%)',
  css: 'hsl(264, 60%, 55%)',
};

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [profile, setProfile] = useState({ display_name: null });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [activeTab, setActiveTab] = useState('rooms');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, roomsRes, snapshotsRes] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('user_id', user.id).single(),
      supabase.from('rooms').select('*').order('updated_at', { ascending: false }),
      supabase.from('code_snapshots').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (roomsRes.data) setRooms(roomsRes.data);
    if (snapshotsRes.data) setSnapshots(snapshotsRes.data);
    setLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase.from('rooms').insert({
      owner_id: user.id,
      name: 'Untitled Room',
    }).select().single();

    if (data) {
      await supabase.from('room_members').insert({ room_id: data.id, user_id: user.id });
      navigate(`/room/${data.room_code}`);
    }
    setCreating(false);
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) { setJoinError('Enter a room code'); return; }
    const { data: room } = await supabase.from('rooms').select('*').eq('room_code', joinCode.trim()).single();
    if (!room) { setJoinError('Room not found'); return; }
    if (room.is_locked) { setJoinError('Room is locked'); return; }

    if (user) {
      await supabase.from('room_members').upsert({ room_id: room.id, user_id: user.id });
    }
    navigate(`/room/${room.room_code}`);
  };

  const handleDeleteRoom = async (e, id) => {
    e.stopPropagation();
    await supabase.from('rooms').delete().eq('id', id);
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.room_code.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-border/50 cs-titlebar flex items-center px-6 gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg cs-gradient flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">CodeSync</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
            <div className="w-5 h-5 rounded-full cs-gradient flex items-center justify-center text-[9px] font-bold text-primary-foreground">
              {(profile.display_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium text-foreground">{profile.display_name || user?.email}</span>
          </div>
          <button onClick={handleSignOut} className="cs-btn-ghost !h-8 !px-2.5 text-muted-foreground hover:text-destructive">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome, {profile.display_name || 'Developer'} 👋
            </h2>
            <p className="text-sm text-muted-foreground">Create a room or jump into an existing one.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Rooms', value: rooms.length, icon: LayoutGrid, color: 'text-primary' },
            { label: 'Snapshots', value: snapshots.length, icon: History, color: 'text-accent' },
            { label: 'My Rooms', value: rooms.filter(r => r.owner_id === user?.id).length, icon: Users, color: 'text-yellow-500' },
          ].map(s => (
            <div key={s.label} className="cs-card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleCreateRoom} disabled={creating} className="cs-btn-primary !h-10">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Room
          </button>

          <div className="flex items-center gap-2">
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
              placeholder="Enter room code"
              className="cs-input !w-40 !h-10 font-mono !text-xs"
            />
            <button onClick={handleJoinRoom} className="cs-btn-secondary !h-10 !px-4">
              Join
            </button>
          </div>
          {joinError && <span className="text-xs text-destructive animate-fade-in">{joinError}</span>}

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="cs-input !w-48 !h-10 !pl-9 !text-xs"
            />
          </div>
        </div>

        <div className="flex gap-1 bg-secondary/60 rounded-lg p-1 w-fit border border-border/50">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`h-8 px-4 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'rooms' ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Rooms
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`h-8 px-4 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>
        </div>

        {activeTab === 'rooms' ? (
          <div className="grid gap-3">
            {filteredRooms.length === 0 ? (
              <div className="cs-card p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto">
                  <Code2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {search ? 'No rooms match your search.' : 'No rooms yet. Create one to get started!'}
                </p>
              </div>
            ) : (
              filteredRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/room/${room.room_code}`)}
                  className="cs-card p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LANG_COLORS[room.language] || 'hsl(var(--primary))' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-foreground truncate">{room.name}</span>
                      <span className="cs-badge bg-secondary text-muted-foreground font-mono">{room.room_code}</span>
                      {room.is_locked && <span className="cs-badge bg-destructive/15 text-destructive">Locked</span>}
                      {room.owner_id === user?.id && <span className="cs-badge bg-primary/15 text-primary">Owner</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground capitalize">{room.language}</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(room.updated_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteRoom(e, room.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-8 px-3 rounded-lg bg-secondary/80 text-secondary-foreground text-[11px] font-medium border border-border/50 flex items-center gap-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/50 transition-all">
                    Open <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {snapshots.length === 0 ? (
              <div className="cs-card p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto">
                  <History className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No snapshots yet. Save snapshots from the editor.</p>
              </div>
            ) : (
              snapshots.map(snap => (
                <div key={snap.id} className="cs-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <History className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{snap.label}</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground capitalize">{snap.language}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {format(new Date(snap.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <pre className="text-[11px] text-muted-foreground bg-secondary/50 rounded-lg p-3 max-h-20 overflow-hidden font-mono border border-border/30">
                    {snap.code.slice(0, 200)}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;