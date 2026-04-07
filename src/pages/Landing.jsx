import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Code2, Users, Zap, ArrowRight, LogIn, Sparkles, Shield, Globe } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      <nav className="relative z-10 h-16 flex items-center justify-between px-6 lg:px-12 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg cs-gradient flex items-center justify-center">
            <Code2 className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">CodeSync</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="cs-btn-primary !h-9 !px-4 !text-xs">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/auth')} className="cs-btn-ghost !text-xs">Sign In</button>
              <button onClick={() => navigate('/auth')} className="cs-btn-primary !h-9 !px-4 !text-xs">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-8">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Real-time collaborative coding
            </span>
          </div>

          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Code together,{' '}
              <span className="cs-gradient-text">in real time</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              A powerful collaborative code editor with live cursors, built-in chat, and instant code execution.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="cs-btn-primary !h-12 !px-8 !text-base cs-glow-sm">
                Open Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/auth')} className="cs-btn-primary !h-12 !px-8 !text-base cs-glow-sm">
                  Start Coding Free <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/auth')} className="cs-btn-secondary !h-12 !px-6 !text-base">
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            {[
              { icon: Globe, label: 'Monaco Editor' },
              { icon: Users, label: 'Multi-user rooms' },
              { icon: Zap, label: '6+ languages' },
              { icon: Shield, label: 'Code snapshots' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary/60 border border-border/60 text-xs text-muted-foreground">
                <f.icon className="w-3.5 h-3.5 text-primary/70" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 max-w-3xl w-full animate-fade-in-up cs-glow" style={{ animationDelay: '320ms' }}>
          <div className="cs-card overflow-hidden">
            <div className="h-9 cs-titlebar flex items-center px-4 gap-2 border-b border-border/50">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent/60" />
              </div>
              <span className="text-[10px] text-muted-foreground ml-2 font-mono">main.js — CodeSync</span>
            </div>
            <div className="p-5 font-mono text-xs leading-6 text-muted-foreground">
              <div><span className="text-primary/70">const</span> <span className="text-accent">room</span> = <span className="text-primary/70">await</span> <span className="text-foreground">createRoom</span>(<span className="text-yellow-400/80">"My Project"</span>);</div>
              <div><span className="text-primary/70">const</span> <span className="text-accent">editor</span> = <span className="text-foreground">initMonaco</span>(room.<span className="text-foreground">code</span>);</div>
              <div className="mt-1"><span className="text-muted-foreground/50">// Live collaboration starts instantly</span></div>
              <div><span className="text-foreground">editor</span>.<span className="text-foreground">onType</span>(<span className="text-primary/70">async</span> (<span className="text-accent">change</span>) {'=> {'}</div>
              <div className="pl-4"><span className="text-primary/70">await</span> <span className="text-foreground">syncToRoom</span>(room.<span className="text-foreground">id</span>, change);</div>
              <div>{'}'});</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center border-t border-border/30">
        <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} CodeSync. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;