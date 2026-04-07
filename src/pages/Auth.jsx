import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Code2, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        if (!displayName.trim()) { setError('Please enter a display name'); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] right-[-20%] w-[700px] h-[700px] rounded-full bg-primary/[0.04] blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative">
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cs-gradient flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">CodeSync</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Collaborate on code,{' '}
              <span className="cs-gradient-text">effortlessly</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create rooms, invite your team, and code together in real time with a full-featured editor.
            </p>
          </div>
          <div className="space-y-3">
            {[
              'Real-time collaborative editing',
              'Built-in chat & code execution',
              'Code snapshot history',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-lg flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-sm space-y-8">
          <button onClick={() => navigate('/')} className="cs-btn-ghost !px-0 !text-xs gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </button>

          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg cs-gradient flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CodeSync</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Sign in to continue to your dashboard.' : 'Get started with CodeSync for free.'}
            </p>
          </div>

          <div className="cs-card p-6 space-y-5">
            <div className="flex bg-secondary/80 rounded-lg p-1">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 h-9 rounded-md text-xs font-semibold transition-all duration-200 ${isLogin ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 h-9 rounded-md text-xs font-semibold transition-all duration-200 ${!isLogin ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="cs-input !pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    required
                    className="cs-input !pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="cs-input !pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="cs-btn-primary w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary font-medium hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;