import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

export function OutputTerminal({ output, isOpen, onToggle, isRunning }) {
  return (
    <div className={`border-t border-border/50 flex flex-col transition-all duration-200 ${isOpen ? 'h-48' : 'h-9'}`}>
      <button
        onClick={onToggle}
        className="h-9 px-4 flex items-center gap-2.5 cs-terminal shrink-0 hover:brightness-110 transition-all"
      >
        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground">Terminal</span>
        {isRunning && (
          <span className="text-[10px] text-accent font-medium animate-pulse-dot ml-1">Running...</span>
        )}
        <div className="ml-auto">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 cs-terminal font-mono text-xs text-accent whitespace-pre-wrap animate-fade-in leading-5">
          {output || <span className="text-muted-foreground/50">Click "Run" to execute your code...</span>}
        </div>
      )}
    </div>
  );
}